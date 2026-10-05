import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_COOKIE, adminCookieOptions, adminToken, codeIsValid, isAdmin } from "@/lib/admin/auth";

const loginSchema = z.object({ code: z.string().max(80) });

/** GET /api/admin/login — la session en cours est-elle celle de l'atelier ? */
export async function GET(req: Request) {
  return NextResponse.json({ admin: isAdmin(req) });
}

/** POST /api/admin/login — ouvre la session atelier (code partagé). */
export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success || !codeIsValid(parsed.data.code)) {
      return NextResponse.json({ error: "Code incorrect." }, { status: 401 });
    }
    const res = NextResponse.json({ admin: true });
    res.cookies.set(ADMIN_COOKIE, adminToken(parsed.data.code), adminCookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}

/** DELETE /api/admin/login — ferme la session atelier. */
export async function DELETE() {
  const res = NextResponse.json({ admin: false });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return res;
}
