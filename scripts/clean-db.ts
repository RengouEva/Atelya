import { PrismaClient } from "@prisma/client";

/** Nettoie les données de test pour livrer une base vierge dans le dépôt. */
const db = new PrismaClient();

async function main() {
  const [visuals, projects, clients] = await Promise.all([
    db.aiVisual.deleteMany(),
    db.studioProject.deleteMany(),
    db.client.deleteMany(),
  ]);
  console.log(`AiVisual supprimés: ${visuals.count}`);
  console.log(`StudioProject supprimés: ${projects.count}`);
  console.log(`Client supprimés: ${clients.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
