import { createHash } from "crypto";
import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { z } from "zod";

import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/ai/prompt";
import { MODELS, type ModelKey } from "@/lib/atelier/patterns";

const schema = z.object({
  kind: z.enum(["garment", "fabric", "pieces"]),
  model: z.string().refine(
    (k): k is ModelKey => Object.prototype.hasOwnProperty.call(MODELS, k),
    "Modèle inconnu"
  ),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Coloris invalide"),
  L: z.coerce.number().min(15).max(200),
  /** nonce → force une nouvelle variation (contourne le cache) */
  nonce: z.string().max(40).optional(),
});

/** POST /api/ai/visual — génère (ou relit depuis le cache) un visuel IA. */
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const { kind, model, color, L, nonce } = parsed.data;
    const m = MODELS[model];

    const { prompt, size } = buildPrompt(kind, {
      modelKey: model,
      name: m.n,
      fab: m.fab,
      color,
      L,
    });

    const sig = createHash("sha1")
      .update(`${kind}|${model}|${color}|${Math.round(L / 10)}|${nonce ?? ""}`)
      .digest("hex");

    const cached = await db.aiVisual.findUnique({ where: { sig } });
    if (cached) {
      return NextResponse.json({
        url: `/api/ai/visual/image/${sig}`,
        cached: true,
        prompt,
      });
    }

    const zai = await ZAI.create();
    const res = await zai.images.generations.create({ prompt, size });
    const b64 = res.data?.[0]?.base64;
    if (!b64) throw new Error("Le modèle d'image n'a renvoyé aucun visuel.");

    await db.aiVisual.create({ data: { kind, sig, prompt, data: b64 } });

    return NextResponse.json({
      url: `/api/ai/visual/image/${sig}`,
      cached: false,
      prompt,
    });
  } catch (e) {
    console.error("POST /api/ai/visual", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.includes("renvoyé")
            ? e.message
            : "La génération IA est indisponible pour le moment. Réessayez dans un instant.",
      },
      { status: 500 }
    );
  }
}
