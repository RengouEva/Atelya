import sharp from "sharp";
import * as fs from "fs";

import { PrismaClient } from "@prisma/client";

/**
 * Amorce la galerie avec 2 exemples de démonstration (photos /public).
 * Idempotent : ne réinsère pas si des exemples existent déjà.
 */
const db = new PrismaClient();

async function photoDataUrl(path: string): Promise<string> {
  const buf = await sharp(path).resize(800, 1066, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main() {
  const count = await db.example.count();
  if (count > 0) {
    console.log(`Exemples déjà présents : ${count} — rien à faire.`);
    return;
  }

  const robe = await photoDataUrl("public/ai/robe-ia.png");
  const raffinee = await photoDataUrl("public/ai/ex-raffinee.png");

  await db.example.createMany({
    data: [
      {
        name: "Robe fluide — référence atelier",
        photo: robe,
        family: "robe",
        measures: JSON.stringify({ P: 90, T: 70, H: 98, L: 90, W: 140, S: 1.5, C: "#2A9DB5" }),
        note: "Base d'apprentissage : pinces de taille marquées, ourlet 3 cm.",
      },
      {
        name: "Robe raffinée — version ceinturée",
        photo: raffinee,
        family: "robe",
        measures: JSON.stringify({ P: 92, T: 72, H: 100, L: 95, W: 140, S: 1.5, C: "#C96F4A" }),
        note: "À suivre pour travailler la pose de la ceinture sur la taille.",
      },
    ],
  });
  console.log("2 exemples de démonstration publiés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
