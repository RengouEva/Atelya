import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const updateSchema = z.object({
  selected: z.number().int().min(-1).max(2).optional(),
  variants: z
    .array(
      z.object({
        sig: z.string().regex(/^[0-9a-f]{40}$/i),
        url: z.string().max(200),
        label: z.string().max(60),
        desc: z.string().max(200),
        direction: z.number().int().min(0).max(2),
      })
    )
    .max(3)
    .optional(),
  name: z.string().trim().min(1).max(60).optional(),
});

/** GET /api/studio/[id] — projet complet. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.studioProject.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e) {
    console.error("GET /api/studio/[id]", e);
    return NextResponse.json(
      { error: "Lecture impossible." },
      { status: 500 }
    );
  }
}

/** PUT /api/studio/[id] — mémorise la sélection / les variantes. */
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
    const data: {
      selected?: number;
      name?: string;
      variants?: string;
    } = {};
    if (parsed.data.selected !== undefined) data.selected = parsed.data.selected;
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.variants !== undefined)
      data.variants = JSON.stringify(parsed.data.variants);

    const project = await db.studioProject.update({ where: { id }, data });
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
