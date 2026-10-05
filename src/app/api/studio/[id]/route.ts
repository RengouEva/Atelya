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

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  measures: measuresSchema.optional(),
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

/** GET /api/studio/[id] — projet complet (avec son modèle). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.studioProject.findUnique({
      where: { id },
      include: { model: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e) {
    console.error("GET /api/studio/[id]", e);
    return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  }
}

/** PUT /api/studio/[id] — mesures, accessoires ou nom du projet. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const project = await db.studioProject.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.measures !== undefined
          ? { measures: JSON.stringify(d.measures) }
          : {}),
        ...(d.accessories !== undefined
          ? { accessories: JSON.stringify(d.accessories) }
          : {}),
      },
    });
    return NextResponse.json({ project });
  } catch (e) {
    console.error("PUT /api/studio/[id]", e);
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 }
    );
  }
}

/** DELETE /api/studio/[id] — supprime le projet. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.studioProject.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/studio/[id]", e);
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 }
    );
  }
}
