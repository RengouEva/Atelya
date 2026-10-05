import { createHash } from "crypto";

/**
 * Accès à l'espace atelier (encadrement) : un code partagé, stocké dans
 * ADMIN_CODE (.env), donne un cookie signé valable 7 jours. Volontairement
 * simple — pas de comptes utilisateurs pour cette application pédagogique.
 */

export const ADMIN_COOKIE = "atelya_atelier";

/** Jeton dérivé du code : change si le code change (cookies invalidés). */
export function adminToken(code: string): string {
  return createHash("sha256").update(`atelya::${code}`).digest("hex");
}

/** Le code saisi correspond-il au code de l'atelier ? */
export function codeIsValid(code: string): boolean {
  const expected = process.env.ADMIN_CODE ?? "atelya-atelier";
  return code.trim().length > 0 && code.trim() === expected;
}

/** La requête porte-t-elle un cookie d'atelier valide ? */
export function isAdmin(req: Request): boolean {
  const raw = req.headers.get("cookie") ?? "";
  const hit = raw
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  if (!hit) return false;
  const value = decodeURIComponent(hit.slice(ADMIN_COOKIE.length + 1));
  return value === adminToken(process.env.ADMIN_CODE ?? "atelya-atelier");
}

/** Réglages du cookie d'atelier (7 jours, inaccessible au JS). */
export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
