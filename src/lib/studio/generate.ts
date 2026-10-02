import { createHash } from "crypto";

import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

/** Empreinte stable d'une image (data URL) pour le cache. */
export function photoHash(dataUrl: string): string {
  return createHash("sha1").update(dataUrl).digest("hex");
}

export function sigOf(...parts: string[]): string {
  return createHash("sha1").update(parts.join("|")).digest("hex");
}

export interface EditCacheResult {
  url: string;
  cached: boolean;
  sig: string;
}

/**
 * Génère une image par édition IA (image → image) et la met en cache
 * en base (table AiVisual). Si l'empreinte existe déjà, l'image est
 * renvoyée instantanément sans nouvel appel.
 */
export async function editWithCache(opts: {
  kind: string;
  sig: string;
  prompt: string;
  /** image source en data URL (obligatoire pour l'édition) */
  image: string;
  size: string;
}): Promise<EditCacheResult> {
  const existing = await db.aiVisual.findUnique({ where: { sig: opts.sig } });
  if (existing) {
    return { url: `/api/studio/image/${opts.sig}`, cached: true, sig: opts.sig };
  }

  const zai = await ZAI.create();

  /** L'API d'images limite le débit : on réessaie face à un 429. */
  const attempt = async (tries = 3): Promise<string> => {
    try {
      const res = await zai.images.generations.edit({
        prompt: opts.prompt,
        images: [{ url: opts.image }],
        size: opts.size,
      });
      const b64 = res.data?.[0]?.base64;
      if (!b64) throw new Error("Le modèle d'image n'a renvoyé aucun visuel.");
      return b64;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (tries > 1 && (msg.includes("429") || msg.includes("Too many"))) {
        await new Promise((r) => setTimeout(r, 4000));
        return attempt(tries - 1);
      }
      throw e;
    }
  };

  const b64 = await attempt();

  await db.aiVisual.create({
    data: { kind: opts.kind, sig: opts.sig, prompt: opts.prompt, data: b64 },
  });

  return { url: `/api/studio/image/${opts.sig}`, cached: false, sig: opts.sig };
}
