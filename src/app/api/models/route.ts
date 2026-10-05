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

const createSchema = z.object({
  name: z.string().trim().min(1, "Nommez le modèle").max(60),
  category: z.enum(catKeys),
  photo: z.string().max(3_500_000).optional(),
  description: z.string().trim().max(200).optional(),
  baseMeasures: measuresSchema,
  shape: z.record(z.string(), z.unknown()).optional(),
  pieces: z.array(pieceSchema).min(1, "Ajoutez au moins une pièce"),
  assembly: z.array(z.array(z.string().max(300)).max(5)).optional(),
  accessories: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

/** GET /api/models — catalogue public (?all=1 pour l'admin : inclut les brouillons). */
export async function GET(req: Request) {
  try {
    const all = new URL(req.url).searchParams.get("all") === "1" && isAdmin(req);
    const rows = await db.garmentModel.findMany({
      where: all ? {} : { published: true },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ models: rows.map(shapeModel) });
  } catch (e) {
    console.error("GET /api/models", e);
    return NextResponse.json(
      { error: "Impossible de lire le catalogue." },
      { status: 500 }
    );
  }
}

/** POST /api/models — publie un modèle (réservé à l'encadrement). */
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { error: "Accès réservé à l'atelier." },
      { status: 401 }
    );
  }
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const model = await db.garmentModel.create({
      data: {
        name: d.name,
        category: d.category,
        photo: d.photo ?? "",
        description: d.description || null,
        baseMeasures: JSON.stringify(d.baseMeasures),
        shape: JSON.stringify(d.shape ?? {}),
        pieces: JSON.stringify(d.pieces),
        assembly: JSON.stringify(d.assembly ?? []),
        accessories: JSON.stringify(d.accessories ?? []),
        published: d.published ?? true,
      },
    });
    return NextResponse.json({ model: shapeModel(model) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/models", e);
    return NextResponse.json(
      { error: "Publication impossible." },
      { status: 500 }
    );
  }
}
