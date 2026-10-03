import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { familyByKey } from "@/lib/studio/config";

const measuresSchema = z.object({
  P: z.coerce.number().min(60).max(160),
  T: z.coerce.number().min(40).max(160),
  H: z.coerce.number().min(60).max(180),
  L: z.coerce.number().min(15).max(200),
  W: z.coerce.number().min(60).max(300),
  S: z.coerce.number().min(0).max(5),
  C: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Nommez votre projet").max(60),
  photo: z
    .string()
    .startsWith("data:image/")
    .max(3_500_000, "Photo trop volumineuse"),
  family: z.enum(["robe", "jupe", "pantalon", "haut", "veste"]),
  measures: measuresSchema,
});

/** GET /api/studio — derniers projets (photo incluse, limité à 12). */
export async function GET() {
  try {
    const projects = await db.studioProject.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
    });
    return NextResponse.json({ projects });
  } catch (e) {
    console.error("GET /api/studio", e);
    return NextResponse.json(
      { error: "Impossible de lire les projets." },
      { status: 500 }
    );
  }
}

/** POST /api/studio — crée le projet à partir de la photo du styliste. */
export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const { name, photo, family, measures } = parsed.data;
    // La longueur par défaut suit la famille si elle n'est pas cohérente.
    const fam = familyByKey(family);
    const project = await db.studioProject.create({
      data: {
        name,
        photo,
        family,
        measures: JSON.stringify({ ...measures, L: measures.L || fam.L }),
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error("POST /api/studio", e);
    return NextResponse.json(
      { error: "Création du projet impossible." },
      { status: 500 }
    );
  }
}
