import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { editWithCache, sigOf } from "@/lib/studio/generate";

const schema = z.object({
  /** empreinte de la variante sélectionnée (image source) */
  variantSig: z.string().regex(/^[0-9a-f]{40}$/i),
  nonce: z.string().max(40).optional(),
});

/**
 * POST /api/studio/pieces — à partir de la variante retenue, met en scène
 * les pièces du patron (papier épinglé sur le tissu, table de coupe).
 */
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const { variantSig, nonce } = parsed.data;

    const src = await db.aiVisual.findUnique({ where: { sig: variantSig } });
    if (!src) {
      return NextResponse.json(
        { error: "Variante introuvable. Régénérez les variantes." },
        { status: 404 }
      );
    }

    const sig = sigOf("pieces", variantSig, nonce ?? "");
    const prompt =
      "From this garment design, produce a realistic top-view photograph of a tailor's cutting table: white paper sewing-pattern pieces of this exact garment pinned onto fabric in the garment's own dominant color, tailor's chalk seam lines and notches, pins, professional fabric scissors and a measuring tape laid nearby, warm atelier lighting, photorealistic, high quality, detailed";

    const r = await editWithCache({
      kind: "pieces",
      sig,
      prompt,
      image: `data:${src.mime || "image/png"};base64,${src.data}`,
      size: "1152x864",
    });

    return NextResponse.json({ url: r.url, cached: r.cached, sig });
  } catch (e) {
    console.error("POST /api/studio/pieces", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.includes("renvoyé")
            ? e.message
            : "La génération du visuel pièces est indisponible. Réessayez.",
      },
      { status: 500 }
    );
  }
}
