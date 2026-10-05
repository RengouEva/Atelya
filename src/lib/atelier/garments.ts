/**
 * Catalogue atelier — modèles validés par l'encadrement.
 *
 * Chaque modèle du catalogue est défini par l'admin : catégorie, photo de
 * référence, mesures de base, pièces de patronage (ajoutées manuellement),
 * méthode d'assemblage et accessoires proposables dans la confection 3D.
 * Ce module contient les types partagés, le catalogue des accessoires,
 * les gabarits par catégorie et les helpers de mise à l'échelle.
 */

import type { AsmStep, Join, PieceDef } from "@/lib/atelier/patterns";

/* ------------------------------------------------------------------ */
/* Catégories                                                          */
/* ------------------------------------------------------------------ */

export type CategoryKey =
  | "robe"
  | "jupe"
  | "pantalon"
  | "tshirt"
  | "chemise"
  | "veste";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  /** longueur par défaut (cm) */
  L: number;
  /** silhouette d'illustration quand le modèle n'a pas de photo */
  icon: "robe" | "evasee" | "pantalon" | "tshirt" | "blouse" | "blazer";
  /** gabarit de forme 3D par défaut */
  shape: ShapeParams;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "robe", label: "Robe", L: 90, icon: "robe", shape: { length: 90, flare: 0.55, sleeves: "none", collar: "v", fit: "straight", waistband: false } },
  { key: "jupe", label: "Jupe", L: 60, icon: "evasee", shape: { length: 60, flare: 0.6, sleeves: "none", collar: "round", fit: "straight", waistband: true } },
  { key: "pantalon", label: "Pantalon", L: 100, icon: "pantalon", shape: { length: 100, flare: 0.12, sleeves: "none", collar: "round", fit: "straight", waistband: true } },
  { key: "tshirt", label: "T-shirt", L: 70, icon: "tshirt", shape: { length: 70, flare: 0.1, sleeves: "short", collar: "round", fit: "loose", waistband: false } },
  { key: "chemise", label: "Chemise", L: 72, icon: "blouse", shape: { length: 72, flare: 0.12, sleeves: "long", collar: "shirt", fit: "straight", waistband: false } },
  { key: "veste", label: "Veste", L: 65, icon: "blazer", shape: { length: 65, flare: 0.15, sleeves: "long", collar: "lapel", fit: "fitted", waistband: false } },
];

export const categoryByKey = (k: string): CategoryDef =>
  CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[0];

/* ------------------------------------------------------------------ */
/* Paramètres de forme (rendu 3D paramétrique)                         */
/* ------------------------------------------------------------------ */

export interface ShapeParams {
  /** longueur totale du vêtement (cm) */
  length: number;
  /** évasement 0 = droit, 1 = très évasé */
  flare: number;
  /** manches */
  sleeves: "none" | "short" | "three_quarter" | "long";
  /** encolure / col */
  collar: "round" | "v" | "shirt" | "lapel";
  /** coupe */
  fit: "fitted" | "straight" | "loose";
  /** ceinture à la taille */
  waistband: boolean;
}

/* ------------------------------------------------------------------ */
/* Accessoires de confection 3D                                        */
/* ------------------------------------------------------------------ */

export type AccessoryKey =
  | "bouton"
  | "fermeture"
  | "rivet"
  | "ceinture"
  | "poche"
  | "noeud";

export interface AccessoryDef {
  key: AccessoryKey;
  label: string;
  desc: string;
  /** couleur métallique / matériau par défaut */
  color: string;
}

export const ACCESSORIES: AccessoryDef[] = [
  { key: "bouton", label: "Boutons", desc: "Rangée de boutons sur le devant", color: "#d4af37" },
  { key: "fermeture", label: "Fermeture éclair", desc: "Zip visible au centre devant ou côté", color: "#8a8f98" },
  { key: "rivet", label: "Rivets", desc: "Clous décoratifs aux points de tension", color: "#b87333" },
  { key: "ceinture", label: "Ceinture", desc: "Ceinture nouée ou bouclée à la taille", color: "#5b3a29" },
  { key: "poche", label: "Poches plaquées", desc: "Deux poches appliquées devant", color: "" },
  { key: "noeud", label: "Nœud", desc: "Nœud décoratif à la taille", color: "#2A9DB5" },
];

export const accessoryByKey = (k: string): AccessoryDef | undefined =>
  ACCESSORIES.find((a) => a.key === k);

/** Un accessoire retenu dans la confection, avec sa couleur. */
export interface ChosenAccessory {
  type: AccessoryKey;
  color: string;
}

/* ------------------------------------------------------------------ */
/* Pièces de patronage définies par l'admin                            */
/* ------------------------------------------------------------------ */

/** Pièce de patronage telle que saisie par l'admin (cm, aux mesures de base). */
export interface AdminPiece {
  /** nom — « Devant », « Dos », « Manche »… */
  n: string;
  /** largeur du tracé (cm) */
  w: number;
  /** hauteur / longueur du tracé (cm) */
  h: number;
  /** nombre d'exemplaires à couper */
  q: number;
  /** pièce à couper au pli du tissu */
  fold?: boolean;
  /** silhouette du tracé */
  shape: PieceShape;
  note?: string;
}

export type PieceShape = "rect" | "trapeze" | "sleeve" | "pant" | "band";

/** Convertit une pièce admin en PieceDef (tracé SVG en cm) pour l'affichage. */
export function adminPieceToDef(p: AdminPiece): PieceDef {
  const { w, h, shape } = p;
  let d = `M0 0H${w}V${h}H0Z`;
  if (shape === "trapeze") {
    const f = Math.min(w * 0.35, h * 0.45);
    d = `M${f / 2} 0H${w - f / 2}L${w} ${h}H0Z`;
  } else if (shape === "sleeve") {
    const cap = Math.min(7, w * 0.16);
    const taper = Math.min(5, w * 0.12);
    d = `M0 ${cap}Q${w * 0.15} ${cap * 0.1} ${w / 2} 0Q${w * 0.85} ${cap * 0.1} ${w} ${cap}L${w - taper} ${h}H${taper}Z`;
  } else if (shape === "pant") {
    const t = Math.max(2, w * 0.22);
    d = `M0 0H${w}L${w - t} ${h}H${t / 2}Z`;
  } else if (shape === "band") {
    const m = Math.max(2, h * 0.8);
    d = `M0 ${m / 2}H${w}M0 ${m}H${w}`;
  }
  return { n: p.n, d, w, h, q: p.q, fold: p.fold, note: p.note };
}

/* ------------------------------------------------------------------ */
/* Mise à l'échelle : mesures de base → mesures de la cliente          */
/* ------------------------------------------------------------------ */

export interface BaseMeasures {
  P: number;
  T: number;
  H: number;
  L: number;
  W: number;
  S: number;
  C: string;
}

/**
 * Facteurs d'échelle du patronage : la largeur suit poitrine/hanches,
 * la hauteur suit la longueur. Bornés pour rester réaliste.
 */
export function scaleOf(base: BaseMeasures, m: BaseMeasures): { ws: number; hs: number } {
  const ws = Math.min(1.35, Math.max(0.75, (m.P + m.H) / (base.P + base.H || 1)));
  const hs = Math.min(1.6, Math.max(0.55, m.L / (base.L || 1)));
  return { ws, hs };
}

/** Pièces du modèle mises à l'échelle des mesures de la cliente. */
export function scaledPieces(
  pieces: AdminPiece[],
  base: BaseMeasures,
  m: BaseMeasures
): PieceDef[] {
  const { ws, hs } = scaleOf(base, m);
  return pieces.map((p) =>
    adminPieceToDef({
      ...p,
      w: Math.round(p.w * ws * 10) / 10,
      h: Math.round(p.h * hs * 10) / 10,
    })
  );
}

/* ------------------------------------------------------------------ */
/* Types client (modèle tel que renvoyé par /api/models)               */
/* ------------------------------------------------------------------ */

export interface CatalogModel {
  id: string;
  name: string;
  category: CategoryKey;
  photo: string;
  description: string | null;
  baseMeasures: BaseMeasures;
  shape: ShapeParams;
  pieces: AdminPiece[];
  assembly: AsmStep[];
  accessories: AccessoryKey[];
  published: boolean;
  createdAt: string;
}

/** Dénorme le modèle (JSON strings → objets) côté client/serveur. */
export function shapeModel(row: {
  id: string;
  name: string;
  category: string;
  photo: string;
  description: string | null;
  baseMeasures: string;
  shape: string;
  pieces: string;
  assembly: string;
  accessories: string;
  published: boolean;
  createdAt: Date | string;
}): CatalogModel {
  return {
    id: row.id,
    name: row.name,
    category: (CATEGORIES.find((c) => c.key === row.category)?.key ?? "robe") as CategoryKey,
    photo: row.photo,
    description: row.description,
    baseMeasures: JSON.parse(row.baseMeasures) as BaseMeasures,
    shape: { ...categoryByKey(row.category).shape, ...(JSON.parse(row.shape || "{}") as Partial<ShapeParams>) },
    pieces: JSON.parse(row.pieces || "[]") as AdminPiece[],
    assembly: JSON.parse(row.assembly || "[]") as AsmStep[],
    accessories: JSON.parse(row.accessories || "[]") as AccessoryKey[],
    published: row.published,
    createdAt:
      typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Gabarits par catégorie (pré-remplissage admin + seed initial)       */
/* ------------------------------------------------------------------ */

export interface CategoryTemplate {
  pieces: AdminPiece[];
  assembly: AsmStep[];
  accessories: AccessoryKey[];
}

const beltPiece = (t: number): AdminPiece => ({
  n: "Ceinture",
  w: t + 4,
  h: 8,
  q: 1,
  shape: "band",
});

export const CATEGORY_TEMPLATES: Record<CategoryKey, CategoryTemplate> = {
  robe: {
    pieces: [
      { n: "Devant", w: 27, h: 90, q: 1, fold: true, shape: "trapeze", note: "Couper au pli, cran de taille" },
      { n: "Dos", w: 27, h: 90, q: 1, fold: true, shape: "trapeze", note: "Couper au pli, fente au milieu dos" },
      { n: "Manche", w: 34, h: 25, q: 2, shape: "sleeve", note: "Tête de manche froncée" },
    ],
    assembly: [
      ["Piquez les pinces de taille du devant, puis du dos, en pli creux.", "Devant", undefined, undefined, "Couture de préparation : pinces de taille (milieux devant et dos)"],
      ["Assemblez le devant au dos, bord contre bord, endroit contre endroit.", "Devant", "Dos", "ll", "Côtés : bord droit du devant ↔ bord gauche du dos, à 1,5 cm"],
      ["Montez les manches : froncez la tête, posez au corps endroit contre endroit.", "Devant", "Manche", "tt", "Emmanchure : tête de manche ↔ emmanchure, à 1 cm"],
      ["Réalisez l'ourlet du bas : rentrez 2 cm, repassez, piquez.", "Devant", undefined, undefined, "Ourlet du bas : 2 cm rentrés, ligne à 1,8 cm du bord"],
    ],
    accessories: ["bouton", "fermeture", "ceinture", "noeud"],
  },
  jupe: {
    pieces: [
      { n: "Devant", w: 26, h: 60, q: 1, fold: true, shape: "trapeze", note: "Couper au pli" },
      { n: "Dos", w: 26, h: 60, q: 1, fold: true, shape: "trapeze", note: "Couper au pli" },
      beltPiece(70),
    ],
    assembly: [
      ["Piquez les pinces de taille devant et dos, en pli creux.", "Devant", undefined, undefined, "Couture de préparation : pinces de taille"],
      ["Assemblez les côtés, endroit contre endroit, puis surfilez.", "Devant", "Dos", "ll", "Côtés : à 1,5 cm, laisser la pause côté gauche"],
      ["Posez la fermeture à la pause dos.", "Dos", undefined, undefined, "Fermeture invisible : 18 cm, à la pause côté gauche"],
      ["Montez la ceinture : entoilez, pliez endos contre endos, appliquez sur la taille.", "Devant", "Ceinture", "tc", "Taille : ceinture centrée sur le haut de la jupe"],
      ["Faites l'ourlet du bas : 3 cm rentrés deux fois.", "Devant", undefined, undefined, "Ourlet du bas : 3 cm, ligne à 2,5 cm du bord"],
    ],
    accessories: ["fermeture", "ceinture", "bouton", "noeud"],
  },
  pantalon: {
    pieces: [
      { n: "Devant", w: 32, h: 100, q: 2, shape: "pant", note: "Un devant par jambe" },
      { n: "Dos", w: 36, h: 100, q: 2, shape: "pant", note: "Un dos par jambe" },
      beltPiece(72),
      { n: "Passant", w: 5, h: 6, q: 5, shape: "rect", note: "Boucle de ceinture" },
    ],
    assembly: [
      ["Assemblez les entrejambes : devant ensemble, dos ensemble.", "Devant", "Devant", "rr", "Entrejambe : montant avant, à 1,5 cm"],
      ["Montez la fourche : assemblez devant et dos en une seule couture.", "Devant", "Dos", "tt", "Fourche : couture d'une seule pièce, à 1,5 cm"],
      ["Assemblez les côtés, endroit contre endroit.", "Devant", "Dos", "ll", "Côtés : à 1,5 cm, pause côté gauche"],
      ["Posez la fermeture braguette côté gauche.", "Devant", undefined, undefined, "Braguette : fermeture 15 cm sous pont"],
      ["Montez la ceinture et répartissez les passants.", "Devant", "Ceinture", "tc", "Taille : ceinture + 5 passants répartis"],
      ["Ourlets de bas de jambe : 3 cm rentrés.", "Devant", undefined, undefined, "Ourlet bas : à 2,5 cm du bord"],
    ],
    accessories: ["fermeture", "rivet", "ceinture", "bouton"],
  },
  tshirt: {
    pieces: [
      { n: "Devant", w: 27, h: 70, q: 1, fold: true, shape: "trapeze" },
      { n: "Dos", w: 27, h: 70, q: 1, fold: true, shape: "trapeze" },
      { n: "Manche", w: 24, h: 22, q: 2, shape: "sleeve" },
      { n: "Encolure", w: 42, h: 6, q: 1, shape: "band", note: "Bord-côte taille + 10 %" },
    ],
    assembly: [
      ["Assemblez les épaules devant/dos, endroit contre endroit.", "Devant", "Dos", "tt", "Épaules : à 1 cm, surpiquer l'arrière"],
      ["Montez les manches à plat sur les emmanchures.", "Devant", "Manche", "tt", "Emmanchure : à 1 cm, sans fronce"],
      ["Fermez les côtés en une seule couture manche-taille.", "Devant", "Manche", "ll", "Côtés : d'un bout à l'autre de la manche, à 1 cm"],
      ["Posez le bord-côte d'encolure, étiré légèrement.", "Devant", "Encolure", "tt", "Encolure : bord-côte plié, ligne à 0,8 cm"],
      ["Ourlets de manches et du bas : 2 cm rentrés.", "Devant", undefined, undefined, "Ourlet bas : ligne à 1,8 cm"],
    ],
    accessories: ["poche", "rivet"],
  },
  chemise: {
    pieces: [
      { n: "Devant", w: 26, h: 72, q: 2, shape: "rect", note: "Un devant gauche, un devant droit (patte boutonnée)" },
      { n: "Dos", w: 30, h: 72, q: 1, fold: true, shape: "rect" },
      { n: "Empiècement", w: 30, h: 8, q: 2, shape: "band", note: "Yoke épaule dos" },
      { n: "Manche", w: 30, h: 58, q: 2, shape: "sleeve" },
      { n: "Col", w: 22, h: 8, q: 2, shape: "band", note: "Col + pied de col entoilés" },
      { n: "Poignet", w: 18, h: 7, q: 2, shape: "band" },
    ],
    assembly: [
      ["Montez l'empiècement dos entre les deux épaisseurs.", "Dos", "Empiècement", "tt", "Empiècement : montage à l'anglaise, à 1 cm"],
      ["Assemblez les épaules devant/empiècement.", "Devant", "Empiècement", "tt", "Épaules : à 1 cm"],
      ["Montez le col : assemblez col et pied, puis appliquez à l'encolure.", "Devant", "Col", "tt", "Encolure : pied de col, à 0,7 cm"],
      ["Posez les manches, puis fermez côtés et manches.", "Devant", "Manche", "tt", "Emmanchure puis couture continue, à 1 cm"],
      ["Posez les poignets et la patte de boutonnage.", "Manche", "Poignet", "bt", "Poignets : appliqués sur le bas de manche"],
      ["Ourlet du bas : 1 cm puis 2 cm.", "Devant", undefined, undefined, "Ourlet bas : à 1,8 cm"],
    ],
    accessories: ["bouton", "poche"],
  },
  veste: {
    pieces: [
      { n: "Devant", w: 28, h: 65, q: 2, shape: "trapeze", note: "Revers marqués au repassage" },
      { n: "Dos", w: 30, h: 65, q: 1, fold: true, shape: "trapeze" },
      { n: "Manche", w: 34, h: 58, q: 2, shape: "sleeve" },
      { n: "Col", w: 24, h: 9, q: 2, shape: "band", note: "Col entoilé" },
      { n: "Poignet", w: 20, h: 7, q: 2, shape: "band" },
    ],
    assembly: [
      ["Piquez les pinces de poitrine du devant.", "Devant", undefined, undefined, "Couture de préparation : pinces de poitrine"],
      ["Assemblez les épaules devant/dos.", "Devant", "Dos", "tt", "Épaules : à 1,2 cm"],
      ["Montez le col entre devant et dos, revers préparés.", "Devant", "Col", "tt", "Encolure : col appliqué, à 1 cm"],
      ["Montez les manches, puis fermez les côtés.", "Devant", "Manche", "tt", "Emmanchure : à 1,2 cm, crans alignés"],
      ["Posez les poignets sur le bas de manche.", "Manche", "Poignet", "bt", "Poignets : à 1 cm, fente à l'arrière"],
      ["Ourlet du bas et boutonnières du devant.", "Devant", undefined, undefined, "Boutonnières : 4 sur le devant droit"],
    ],
    accessories: ["bouton", "poche", "rivet", "ceinture"],
  },
};
