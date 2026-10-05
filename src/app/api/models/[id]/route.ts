import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin/auth";
import { CATEGORIES, shapeModel } from "@/lib/atelier/garments";

const catKeys = CATEGORIES.map((c) => c.key) as [string, ...string[]];

const measuresSchema = z.object({
  P: z.coerce.number().min(60).max(160),
  T: z.coerce.number().min(40).max(160),
  H: z.coerce.number().min(60).max(180),
  L: z.coerce.number().min(15).max(200),
  W: z.coerce.number().min(60).max(300),
  S: z.coerce.number().min(0).max(5),
  C: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const pieceSchema = z.object({
  n: z.string().trim().min(1).max(40),
  w: z.coerce.number().min(2).max(300),
  h: z.coerce.number().min(2).max(300),
  q: z.coerce.number().int().min(1).max(12),
  fold: z.boolean().optional(),
  shape: z.enum(["rect", "trapeze", "sleeve", "pant", "band"]),
  note: z.string().trim().max(140).optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  category: z.enum(catKeys).optional(),
  photo: z.string().max(3_500_000).optional(),
  description: z.string().trim().max(200).optional(),
  baseMeasures: measuresSchema.optional(),
  shape: z.record(z.string(), z.unknown()).optional(),
  pieces: z.array(pieceSchema).min(1).optional(),
  assembly: z.array(z.array(z.string().max(300)).max(5)).optional(),
  accessories: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

/** GET /api/models/[id] — un modèle complet. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.garmentModel.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Modèle introuvable." }, { status: 404 });
    }
    return NextResponse.json({ model: shapeModel(row) });
  } catch (e) {
    console.error("GET /api/models/[id]", e);
    return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  }
}

/** PUT /api/models/[id] — met à jour un modèle (encadrement). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { error: "Accès réservé à l'atelier." },
      { status: 401 }
    );
  }
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
    const row = await db.garmentModel.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.category !== undefined ? { category: d.category } : {}),
        ...(d.photo !== undefined ? { photo: d.photo } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.baseMeasures !== undefined
          ? { baseMeasures: JSON.stringify(d.baseMeasures) }
          : {}),
        ...(d.shape !== undefined ? { shape: JSON.stringify(d.shape) } : {}),
        ...(d.pieces !== undefined ? { pieces: JSON.stringify(d.pieces) } : {}),
        ...(d.assembly !== undefined ? { assembly: JSON.stringify(d.assembly) } : {}),
        ...(d.accessories !== undefined
          ? { accessories: JSON.stringify(d.accessories) }
          : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
      },
    });
    return NextResponse.json({ model: shapeModel(row) });
  } catch (e) {
    console.error("PUT /api/models/[id]", e);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}

/** DELETE /api/models/[id] — retire un modèle du catalogue (encadrement). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { error: "Accès réservé à l'atelier." },
      { status: 401 }
    );
  }
  try {
    const { id } = await params;
    await db.garmentModel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/models/[id]", e);
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 }
    );
  }
}
