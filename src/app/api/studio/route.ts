import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

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
  modelId: z.string().min(1, "Choisissez un modèle du catalogue"),
  measures: measuresSchema,
  accessories: z
    .array(
      z.object({
        type: z.string().max(30),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      })
    )
    .max(6)
    .optional(),
});

/** GET /api/studio — derniers projets (avec le nom du modèle, limité à 12). */
export async function GET() {
  try {
    const projects = await db.studioProject.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { model: { select: { name: true, category: true, photo: true } } },
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

/** POST /api/studio — démarre le projet à partir d'un modèle du catalogue. */
export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const { name, modelId, measures, accessories } = parsed.data;
    const model = await db.garmentModel.findUnique({ where: { id: modelId } });
    if (!model || !model.published) {
      return NextResponse.json(
        { error: "Ce modèle n'est pas disponible." },
        { status: 404 }
      );
    }
    const project = await db.studioProject.create({
      data: {
        name,
        modelId,
        measures: JSON.stringify(measures),
        accessories: JSON.stringify(accessories ?? []),
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
