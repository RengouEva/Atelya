/* Audit DB — comptages + volumétrie SQLite */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const counts = {
  clients: await db.client.count(),
  studioProjects: await db.studioProject.count(),
  aiVisuals: await db.aiVisual.count(),
  examples: await db.example.count(),
};
console.log("Comptages:", JSON.stringify(counts));

// Taille des photos stockées (base64) — top 3 des plus lourdes
const heavy = await db.studioProject.findMany({
  select: { name: true, photo: true, variants: true },
  orderBy: { updatedAt: "desc" },
  take: 12,
});
for (const p of heavy) {
  const vars = JSON.parse(p.variants || "[]") as { sig: string }[];
  console.log(`- projet « ${p.name} » photo=${(p.photo.length / 1024).toFixed(0)} Ko, ${vars.length} variante(s)`);
}
await db.$disconnect();
