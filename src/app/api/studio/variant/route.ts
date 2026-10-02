import { NextResponse } from "next/server";
import { z } from "zod";

import { DIRECTIONS, MANNEQUIN_SCENE, familyByKey } from "@/lib/studio/config";
import { editWithCache, photoHash, sigOf } from "@/lib/studio/generate";

const schema = z.object({
  /** photo du styliste, data URL (jpeg/png) */
  photo: z
    .string()
    .startsWith("data:image/")
    .max(3_500_000, "Photo trop volumineuse"),
  family: z.enum(["robe", "jupe", "pantalon", "haut", "veste"]),
  direction: z.coerce.number().int().min(0).max(DIRECTIONS.length - 1),
  /** nonce → force une nouvelle variation */
  nonce: z.string().max(40).optional(),
});

/**
 * POST /api/studio/variant — décline la photo du styliste en UNE variante
 * (direction 0/1/2) : vêtement redessiné, bien habillé, sur mannequin.
 * Les 3 directions doivent être appelées en parallèle par le client.
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
    const { photo, family, direction, nonce } = parsed.data;
    const dir = DIRECTIONS[direction];
    const fam = familyByKey(family);

    const sig = sigOf("variant", photoHash(photo), family, String(direction), nonce ?? "");
    const prompt = `${MANNEQUIN_SCENE}. ${dir.prompt}. The garment is ${fam.en}.`;

    const r = await editWithCache({
      kind: "variant",
      sig,
      prompt,
      image: photo,
      size: "864x1152",
    });

    return NextResponse.json({
      url: r.url,
      cached: r.cached,
      sig,
      direction,
      label: dir.label,
      desc: dir.desc,
    });
  } catch (e) {
    console.error("POST /api/studio/variant", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.includes("renvoyé")
            ? e.message
            : "La génération de la variante est indisponible. Réessayez.",
      },
      { status: 500 }
    );
  }
}
