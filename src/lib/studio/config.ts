/**
 * Studio — configuration partagée du parcours :
 * familles de vêtements (→ modèles paramétriques du patronage),
 * mesures du projet et presets de coloris.
 */

import type { ModelKey } from "@/lib/atelier/patterns";

export type FamilyKey = "robe" | "jupe" | "pantalon" | "haut" | "veste";

export interface FamilyDef {
  key: FamilyKey;
  label: string;
  /** modèle paramétrique qui sert de base au patron */
  model: ModelKey;
  /** longueur par défaut (cm) */
  L: number;
}

export const FAMILIES: FamilyDef[] = [
  { key: "robe", label: "Robe", model: "robe", L: 90 },
  { key: "jupe", label: "Jupe", model: "evasee", L: 60 },
  { key: "pantalon", label: "Pantalon", model: "pantalon", L: 100 },
  { key: "haut", label: "Haut / Blouse", model: "tunique", L: 70 },
  { key: "veste", label: "Veste", model: "blazer", L: 65 },
];

export const familyByKey = (k: string): FamilyDef =>
  FAMILIES.find((f) => f.key === k) ?? FAMILIES[0];

/* ------------------------------------------------------------------ */
/* Types partagés client / serveur                                     */
/* ------------------------------------------------------------------ */

/** Mesures du projet (cm) + laize, marge, coloris. */
export interface StudioMeasures {
  P: number;
  T: number;
  H: number;
  L: number;
  W: number;
  S: number;
  C: string;
}

export const DEFAULT_MEASURES: StudioMeasures = {
  P: 90,
  T: 70,
  H: 98,
  L: 60,
  W: 140,
  S: 1.5,
  C: "#2A9DB5",
};

/** Presets de coloris pour le tissu. */
export const FABRIC_PRESETS = [
  "#2A9DB5",
  "#C96F4A",
  "#D9A441",
  "#7D4E7E",
  "#4A7C59",
  "#33507A",
  "#C25E6E",
  "#4B4F5C",
];
