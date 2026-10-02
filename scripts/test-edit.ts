/* Test : édition d'image (image-edit) via SDK avec data URL */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const SRC = "/home/z/my-project/public/ai/robe-ia.png";

async function main() {
  const zai = await ZAI.create();
  const b64 = fs.readFileSync(SRC).toString("base64");
  const dataUrl = `data:image/png;base64,${b64}`;

  const res = await zai.images.generations.edit({
    prompt:
      "Show this exact garment as a finished, well-tailored piece displayed on a vintage tailor's dress-form mannequin in a bright haute-couture atelier with soft daylight. Redesign it as a LONGER, flowing, elegant version with a soft drape and refined evening allure, keeping the same fabric, colors and style identity. Professional studio photography, photorealistic, high quality, detailed",
    images: [{ url: dataUrl }],
    size: "864x1152",
  });

  const out = res.data?.[0]?.base64;
  if (!out) throw new Error("réponse vide");
  fs.writeFileSync("/home/z/my-project/public/ai/ex-longue.png", Buffer.from(out, "base64"));
  console.log("OK bytes:", Buffer.from(out, "base64").length);
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
