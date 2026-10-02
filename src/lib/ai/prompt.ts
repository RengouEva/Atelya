/**
 * Studio IA — construction des prompts pour la génération de visuels
 * réalistes (produit fini porté, texture de tissu, pièces en situation).
 * Les prompts sont rédigés en anglais (meilleure qualité de génération),
 * les libellés affichés à l'utilisateur restent en français.
 */

import type { ModelKey } from "@/lib/atelier/patterns";

export type AiKind = "garment" | "fabric" | "pieces";

export const AI_KINDS: AiKind[] = ["garment", "fabric", "pieces"];

/** Descripteurs anglais par modèle — pour un rendu photographique fidèle. */
const EN: Record<ModelKey, string> = {
  droite: "straight knee-length skirt with a fitted waistband",
  crayon: "slim pencil skirt with a fitted waistband",
  evasee: "A-line flared skirt widening towards the hem",
  cercle: "full circle skirt with generous swirling drape",
  mouchoir: "handkerchief-hem flared skirt with pointed asymmetric hem",
  portefeuille: "wrap-front skirt with long tie belt",
  plissee: "knife-pleated skirt with crisp pleats",
  short: "tailored high-waisted shorts with cuff",
  pantalon: "classic straight-leg trousers with waistband",
  large: "wide-leg flowing trousers",
  tshirt: "relaxed crew-neck t-shirt with short set-in sleeves",
  tunique: "long straight tunic top with side slits",
  blouse: "fluid lightweight blouse with soft drape",
  robe: "A-line trapeze dress sleeveless",
  blazer: "tailored blazer jacket with shawl collar, buttons and patch pockets",
  kimono: "kimono jacket in T shape with wide draping sleeves and open front",
  manche: "single set-in sleeve pinned on a tailor's dress form",
};

/** Traduction du tissu conseillé (français → anglais) pour le prompt. */
export function fabricEn(fab: string): string {
  const f = fab.toLowerCase();
  if (f.includes("jersey")) return "soft jersey knit";
  if (f.includes("soie") || f.includes("satin")) return "flowing silk";
  if (f.includes("lin")) return "natural linen";
  if (f.includes("crêpe") || f.includes("crepe")) return "fluid crepe";
  if (f.includes("jean") || f.includes("denim")) return "cotton denim";
  if (f.includes("laine") || f.includes("tweed")) return "soft wool";
  if (f.includes("gabardine")) return "cotton gabardine";
  if (f.includes("popeline")) return "crisp cotton poplin";
  if (f.includes("chambray")) return "cotton chambray";
  if (f.includes("viscose")) return "viscose";
  if (f.includes("polaire")) return "brushed fleece";
  if (f.includes("molleton")) return "sweatshirt fleece";
  if (f.includes("simili") || f.includes("cuir")) return "vegan leather";
  if (f.includes("coton")) return "cotton";
  if (f.includes("velours")) return "velvet";
  return "woven fabric";
}

/** Nom du coloris (à partir du code hex) pour enrichir le prompt. */
export function colorName(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "";
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d < 0.06) {
    if (l > 0.92) return "off-white";
    if (l > 0.78) return "ecru";
    if (l > 0.5) return "light grey";
    if (l > 0.22) return "grey";
    if (l > 0.08) return "charcoal grey";
    return "black";
  }
  const s = d / (1 - Math.abs(2 * l - 1) || 1e-9);
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;

  let base: string;
  if (h < 12) base = "red";
  else if (h < 26) base = "brick red";
  else if (h < 42) base = "orange";
  else if (h < 54) base = "coral";
  else if (h < 66) base = "mustard";
  else if (h < 88) base = "yellow";
  else if (h < 150) base = "green";
  else if (h < 172) base = "mint green";
  else if (h < 190) base = "turquoise";
  else if (h < 205) base = "teal";
  else if (h < 252) base = "blue";
  else if (h < 276) base = "indigo";
  else if (h < 296) base = "violet";
  else if (h < 322) base = "magenta";
  else if (h < 346) base = "fuchsia pink";
  else base = "rose pink";

  if (l > 0.82) return `pastel ${base}`;
  if (l < 0.24) return `deep dark ${base}`;
  if (s < 0.28) return `muted ${base}`;
  return base;
}

/** Qualificatif de longueur pour le produit fini (basé sur L en cm). */
function lengthWord(L: number): string {
  if (L <= 45) return "cropped";
  if (L <= 62) return "knee-length";
  if (L <= 82) return "midi length";
  if (L <= 108) return "long";
  return "floor-length";
}

export interface PromptInput {
  modelKey: ModelKey;
  /** nom français du modèle (traçabilité) */
  name: string;
  /** tissu conseillé du modèle (français) */
  fab: string;
  color: string;
  L: number;
}

const STYLE =
  "photorealistic, professional photography, soft natural light, high quality, detailed";

/** Construit le prompt + la taille d'image adaptés au type de visuel. */
export function buildPrompt(kind: AiKind, i: PromptInput) {
  const en = EN[i.modelKey] ?? "garment";
  const col = colorName(i.color);
  const fab = fabricEn(i.fab);
  const garment = `${col} ${fab}`;

  switch (kind) {
    case "garment":
      return {
        prompt: `Full-body professional studio photograph of an elegant finished ${lengthWord(i.L)} ${en}, sewn in ${garment} (exact fabric color hex ${i.color}), displayed on a vintage tailor's dress-form mannequin standing in a bright haute-couture atelier, large windows with soft daylight, wooden work table with scissors chalk and paper patterns blurred in the background, realistic fabric drape and weave texture, editorial fashion photography style, ${STYLE}`,
        size: "864x1152" as const,
      };
    case "fabric":
      return {
        prompt: `Extreme close-up macro photograph of ${garment} fabric (exact color hex ${i.color}), realistic woven textile texture with visible threads and weave, a few soft folds catching the light, styled on a tailor's table, ${STYLE}`,
        size: "1024x1024" as const,
      };
    case "pieces":
      return {
        prompt: `Realistic top-view photograph of a tailor's cutting table: white paper sewing-pattern pieces for a ${en} pinned onto ${garment} fabric (exact fabric color hex ${i.color}), tailor's chalk seam lines and notches, pins, professional fabric scissors and a measuring tape laid nearby, warm atelier lighting, ${STYLE}`,
        size: "1152x864" as const,
      };
  }
}
