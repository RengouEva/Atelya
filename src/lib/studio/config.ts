/**
 * Studio — configuration du parcours styliste :
 * familles de vêtements (→ modèle paramétrique) et directions
 * des 3 variantes proposées par l'IA (image-edit).
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
  /** description anglaise pour les prompts IA */
  en: string;
}

export const FAMILIES: FamilyDef[] = [
  {
    key: "robe",
    label: "Robe",
    model: "robe",
    L: 90,
    en: "a dress",
  },
  {
    key: "jupe",
    label: "Jupe",
    model: "evasee",
    L: 60,
    en: "a skirt",
  },
  {
    key: "pantalon",
    label: "Pantalon",
    model: "pantalon",
    L: 100,
    en: "a pair of trousers",
  },
  {
    key: "haut",
    label: "Haut / Blouse",
    model: "tunique",
    L: 70,
    en: "a top / blouse",
  },
  {
    key: "veste",
    label: "Veste",
    model: "blazer",
    L: 65,
    en: "a jacket",
  },
];

export const familyByKey = (k: string): FamilyDef =>
  FAMILIES.find((f) => f.key === k) ?? FAMILIES[0];

export interface DirectionDef {
  /** libellé affiché */
  label: string;
  /** description affichée */
  desc: string;
  /** consigne envoyée à l'IA d'édition d'image (anglais) */
  prompt: string;
}

/** Les 3 directions de variation proposées à partir de la photo. */
export const DIRECTIONS: DirectionDef[] = [
  {
    label: "Longue & fluide",
    desc: "La pièce s'allonge : ligne élégante, tombé souple, allure de soirée.",
    prompt:
      "redesign it as a LONGER, flowing, elegant version with a soft drape and refined evening allure, keeping the same fabric, colors and style identity",
  },
  {
    label: "Courte & moderne",
    desc: "Version raccourcie : lignes nettes, esprit contemporain, facile à porter.",
    prompt:
      "redesign it as a SHORTER, cleaner, contemporary version with crisp minimalist lines and a modern everyday look, keeping the same fabric, colors and style identity",
  },
  {
    label: "Détailée & raffinée",
    desc: "Version travaillée : poches, ceinture contrastée et surpiqûres décoratives.",
    prompt:
      "redesign it as a MORE DETAILED, refined couture version with patch pockets, a contrasting waistband or belt and decorative topstitching, keeping the same fabric, colors and style identity",
  },
];

/** Prompt de mise en scène commun : le vêtement porté sur mannequin. */
export const MANNEQUIN_SCENE =
  "Show this exact garment as a finished, well-tailored piece displayed on a vintage tailor's dress-form mannequin, standing in a bright haute-couture atelier with soft daylight from large windows, wooden work table blurred in the background. Professional studio photography, photorealistic, high quality, detailed, full garment visible";

/* ------------------------------------------------------------------ */
/* Types partagés client / serveur                                     */
/* ------------------------------------------------------------------ */

/** Une variante IA proposée à partir de la photo. */
export interface StudioVariant {
  sig: string;
  url: string;
  label: string;
  desc: string;
  direction: number;
}

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

/** Un exemple validé par l'atelier (publié par l'encadrement via /admin). */
export interface StudioExample {
  id: string;
  name: string;
  photo: string;
  family: string;
  measures: StudioMeasures;
  note: string | null;
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

/** Presets de coloris pour le tissu du plan de coupe. */
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
