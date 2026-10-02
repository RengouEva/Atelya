import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/** GET /api/studio/image/[sig] — renvoie une image IA (PNG) mise en cache. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sig: string }> }
) {
  const { sig } = await params;
  if (!/^[0-9a-f]{40}$/i.test(sig)) {
    return new NextResponse("Empreinte invalide.", { status: 400 });
  }
  const row = await db.aiVisual.findUnique({ where: { sig } });
  if (!row) return new NextResponse("Visuel introuvable.", { status: 404 });

  const buf = Buffer.from(row.data, "base64");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime || "image/png",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
