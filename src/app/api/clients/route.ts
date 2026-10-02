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

/** GET /api/clients — liste des fiches clientes */
export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ clients });
  } catch (e) {
    console.error("GET /api/clients", e);
    return NextResponse.json(
      { error: "Impossible de lire les fiches clientes." },
      { status: 500 }
    );
  }
}

/** POST /api/clients — enregistre une nouvelle fiche */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Mesures invalides.", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }
    const client = await db.client.create({ data: parsed.data });
    return NextResponse.json({ client }, { status: 201 });
  } catch (e) {
    console.error("POST /api/clients", e);
    return NextResponse.json(
      { error: "Enregistrement impossible." },
      { status: 500 }
    );
  }
}
