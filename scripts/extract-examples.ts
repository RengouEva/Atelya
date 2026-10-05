/* Extrait les photos de la table Example vers public/models/ (JPEG) avant migration. */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";

const db = new PrismaClient();
mkdirSync("public/models", { recursive: true });

const examples = await db.example.findMany();
for (let i = 0; i < examples.length; i++) {
  const ex = examples[i];
  const b64 = ex.photo.replace(/^data:image\/\w+;base64,/, "");
  const file = `public/models/seed-robe-${i + 1}.jpg`;
  writeFileSync(file, Buffer.from(b64, "base64"));
  console.log(`${ex.name} → ${file} (${ex.family})`);
  console.log(JSON.stringify(ex.measures));
}
await db.$disconnect();
