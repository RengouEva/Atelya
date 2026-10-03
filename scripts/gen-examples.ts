/* Génère les 2 variantes d'exemple restantes pour la landing */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const SRC = "/home/z/my-project/public/ai/robe-ia.png";
const SCENE =
  "Show this exact garment as a finished, well-tailored piece displayed on a vintage tailor's dress-form mannequin in a bright haute-couture atelier with soft daylight. Professional studio photography, photorealistic, high quality, detailed";

const JOBS: { prompt: string; out: string }[] = [
  {
    prompt: `${SCENE} Redesign it as a SHORTER, cleaner, contemporary version with crisp minimalist lines and a modern everyday look, keeping the same fabric, colors and style identity.`,
    out: "/home/z/my-project/public/ai/ex-courte.png",
  },
  {
    prompt: `${SCENE} Redesign it as a MORE DETAILED, refined couture version with patch pockets, a contrasting waistband or belt and decorative topstitching, keeping the same fabric, colors and style identity.`,
    out: "/home/z/my-project/public/ai/ex-raffinee.png",
  },
];

async function main() {
  const zai = await ZAI.create();
  const b64 = fs.readFileSync(SRC).toString("base64");
  const dataUrl = `data:image/png;base64,${b64}`;

  for (const j of JOBS) {
    const res = await zai.images.generations.edit({
      prompt: j.prompt,
      images: [{ url: dataUrl }],
      size: "864x1152",
    });
    const out = res.data?.[0]?.base64;
    if (!out) throw new Error("réponse vide");
    fs.writeFileSync(j.out, Buffer.from(out, "base64"));
    console.log("OK:", j.out);
  }
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
