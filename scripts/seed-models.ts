/**
 * Seed du catalogue atelier — 7 modèles publiés (un par catégorie,
 * 2 robes). Les pièces, la méthode d'assemblage et les accessoires
 * proviennent des gabarits de l'atelier (src/lib/atelier/garments.ts).
 * Photos : robes issues des anciens exemples, autres catégories générées.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync } from "fs";

import {
  CATEGORY_TEMPLATES,
  type CategoryKey,
} from "../src/lib/atelier/garments";

const db = new PrismaClient();

const sharp = require("sharp");

/** PNG public → JPEG base64 (comme une photo déposée par l'admin). */
async function toJpeg(path: string): Promise<string> {
  const buf = await sharp(readFileSync(path))
    .resize(800, 1066, { fit: "cover" })
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

interface Seed {
  name: string;
  category: CategoryKey;
  photo?: string;
  description: string;
  base: { P: number; T: number; H: number; L: number };
  shape?: Record<string, unknown>;
  accessories?: string[];
}

const SEEDS: Seed[] = [
  {
    name: "Robe fluide — référence atelier",
    category: "robe",
    photo: "public/models/seed-robe-1.jpg",
    description: "Ligne fluide et épurée — idéale pour un premier projet",
    base: { P: 90, T: 70, H: 98, L: 90 },
    shape: { length: 90, flare: 0.55, sleeves: "short", collar: "v", fit: "straight", waistband: false },
  },
  {
    name: "Robe raffinée — version ceinturée",
    category: "robe",
    photo: "public/models/seed-robe-2.jpg",
    description: "Taille marquée par une ceinture — niveau intermédiaire",
    base: { P: 92, T: 72, H: 100, L: 95 },
    shape: { length: 95, flare: 0.5, sleeves: "none", collar: "v", fit: "fitted", waistband: false },
    accessories: ["bouton", "fermeture", "ceinture", "noeud"],
  },
  {
    name: "Jupe évasée midi",
    category: "jupe",
    photo: "public/models/seed-jupe.png",
    description: "Jupe évasée à ceinture — la base rassurante",
    base: { P: 90, T: 70, H: 98, L: 62 },
    shape: { length: 62, flare: 0.6, sleeves: "none", collar: "round", fit: "straight", waistband: true },
  },
  {
    name: "Pantalon droit classique",
    category: "pantalon",
    photo: "public/models/seed-pantalon.png",
    description: "Coupe droite intemporelle, braguette zippée",
    base: { P: 90, T: 72, H: 100, L: 102 },
    shape: { length: 102, flare: 0.12, sleeves: "none", collar: "round", fit: "straight", waistband: true },
  },
  {
    name: "T-shirt col rond",
    category: "tshirt",
    photo: "public/models/seed-tshirt.png",
    description: "Le indispensable — coupe droite, bord-côte d'encolure",
    base: { P: 90, T: 74, H: 96, L: 68 },
    shape: { length: 68, flare: 0.1, sleeves: "short", collar: "round", fit: "loose", waistband: false },
  },
  {
    name: "Chemise manches longues",
    category: "chemise",
    photo: "public/models/seed-chemise.png",
    description: "Chemise classique : col, patte de boutonnage, poignets",
    base: { P: 92, T: 76, H: 98, L: 72 },
    shape: { length: 72, flare: 0.12, sleeves: "long", collar: "shirt", fit: "straight", waistband: false },
  },
  {
    name: "Veste cintrée à revers",
    category: "veste",
    photo: "public/models/seed-veste.png",
    description: "Blazer cintré, revers crantés — le aboutissement",
    base: { P: 92, T: 74, H: 100, L: 66 },
    shape: { length: 66, flare: 0.15, sleeves: "long", collar: "lapel", fit: "fitted", waistband: false },
  },
];

const W = 140;
const S = 1.5;
const C = "#2A9DB5";

for (const s of SEEDS) {
  const tpl = CATEGORY_TEMPLATES[s.category];
  const photo = s.photo ? await toJpeg(s.photo) : "";
  const bm = { ...s.base, W, S, C };
  const row = await db.garmentModel.create({
    data: {
      name: s.name,
      category: s.category,
      photo,
      description: s.description,
      baseMeasures: JSON.stringify(bm),
      shape: JSON.stringify(s.shape ?? {}),
      pieces: JSON.stringify(tpl.pieces),
      assembly: JSON.stringify(tpl.assembly),
      accessories: JSON.stringify(s.accessories ?? tpl.accessories),
      published: true,
    },
  });
  console.log(`✓ ${row.name} (${row.category}) — ${tpl.pieces.length} pièces, ${tpl.assembly.length} étapes`);
}

writeFileSync(
  "scripts/.seed-done",
  `${await db.garmentModel.count()} modèles\n`
);
await db.$disconnect();
