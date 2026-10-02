import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const num = (min: number, max: number) => z.coerce.number().min(min).max(max);

const clientSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(60, "Nom trop long"),
  P: num(60, 160),
  T: num(40, 160),
  H: num(60, 180),
  L: num(10, 200),
  notes: z.string().trim().max(400).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

/** GET /api/clients/[id] — détail d'une fiche */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const client = await db.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (e) {
    console.error("GET /api/clients/[id]", e);
    return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  }
}

/** PUT /api/clients/[id] — met à jour une fiche */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Mesures invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
    }
    const client = await db.client.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ client });
  } catch (e) {
    console.error("PUT /api/clients/[id]", e);
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 }
    );
  }
}

/** DELETE /api/clients/[id] — supprime une fiche */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
    }
    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/clients/[id]", e);
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 }
    );
  }
}
