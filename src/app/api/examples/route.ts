import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin/auth";
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
  name: z.string().trim().min(1, "Nommez l'exemple").max(60),
  photo: z
    .string()
    .startsWith("data:image/")
    .max(3_500_000, "Photo trop volumineuse"),
  family: z.enum(["robe", "jupe", "pantalon", "haut", "veste"]),
  measures: measuresSchema,
  note: z.string().trim().max(280).optional(),
});

/** Sérialise un exemple pour le client (mesures décodées). */
function shape(ex: {
  id: string;
  name: string;
  photo: string;
  family: string;
  measures: string;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: ex.id,
    name: ex.name,
    photo: ex.photo,
    family: ex.family,
    measures: JSON.parse(ex.measures) as Record<string, unknown>,
    note: ex.note,
    createdAt: ex.createdAt,
  };
}

/** GET /api/examples — galerie publique des exemples de l'atelier. */
export async function GET() {
  try {
    const rows = await db.example.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return NextResponse.json({ examples: rows.map(shape) });
  } catch (e) {
    console.error("GET /api/examples", e);
    return NextResponse.json(
      { error: "Impossible de lire les exemples." },
      { status: 500 }
    );
  }
}

/** POST /api/examples — publie un exemple (réservé à l'encadrement). */
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Accès réservé à l'atelier." }, { status: 401 });
  }
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const { name, photo, family, measures, note } = parsed.data;
    const fam = familyByKey(family);
    const ex = await db.example.create({
      data: {
        name,
        photo,
        family,
        measures: JSON.stringify({ ...measures, L: measures.L || fam.L }),
        note: note || null,
      },
    });
    return NextResponse.json({ example: shape(ex) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/examples", e);
    return NextResponse.json(
      { error: "Publication impossible." },
      { status: 500 }
    );
  }
}

/** DELETE /api/examples?id=… — retire un exemple (réservé à l'encadrement). */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Accès réservé à l'atelier." }, { status: 401 });
  }
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    }
    await db.example.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/examples", e);
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 }
    );
  }
}
