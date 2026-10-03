import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

/**
 * Génère la série photo réaliste « du pli de tissu à la couture » —
 * 5 étapes cohérentes (même tissu bleu roi, même table, même lumière)
 * pour le guide pédagogique de l'atelier Atelya.
 */

const STYLE =
  "Realistic professional photograph in a haute couture sewing atelier, " +
  "warm natural window light from the left, dark wooden atelier table, " +
  "royal blue cotton fabric, shallow depth of field, high quality, detailed, " +
  "no text overlay";

const STAGES: { file: string; prompt: string }[] = [
  {
    file: "/ai/j-plis.png",
    prompt:
      "overhead view of the fabric neatly folded in half on the table, " +
      "soft folds and pleats visible, right sides facing, " +
      "tailor's chalk and a golden measuring tape placed beside the fabric, " +
      STYLE,
  },
  {
    file: "/ai/j-epingle.png",
    prompt:
      "white paper sewing pattern pieces laid flat on the folded fabric and " +
      "held with shiny steel sewing pins pushed through the paper at regular " +
      "intervals, fabric folds visible around the pattern, " +
      STYLE,
  },
  {
    file: "/ai/j-decoupe.png",
    prompt:
      "close-up of hands holding long professional tailor scissors cutting " +
      "the fabric along the edge of the white paper pattern, steel pins " +
      "holding paper and fabric together, cut fabric edge crisp, " +
      STYLE,
  },
  {
    file: "/ai/j-reunir.png",
    prompt:
      "several freshly cut fabric pieces of different shapes gathered on the " +
      "table, each piece with a small round white paper tag pinned on it, " +
      "a spool of golden thread and pins beside the stack of pieces, " +
      STYLE,
  },
  {
    file: "/ai/j-coudre.png",
    prompt:
      "close-up of a sewing machine needle and presser foot stitching a seam " +
      "joining two fabric pieces right sides together, golden topstitch " +
      "thread, hands gently guiding the fabric under the needle, " +
      STYLE,
  },
];

async function main() {
  const zai = await ZAI.create();
  const outDir = "/home/z/my-project/public";
  const report: string[] = [];

  for (const st of STAGES) {
    const out = `${outDir}${st.file}`;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const r = await zai.images.generations.create({
          prompt: st.prompt,
          size: "1152x864",
        });
        const b64 = r.data?.[0]?.base64;
        if (!b64) throw new Error("réponse vide");
        fs.writeFileSync(out, Buffer.from(b64, "base64"));
        const kb = Math.round(fs.statSync(out).size / 1024);
        report.push(`OK ${st.file} (${kb} Ko)`);
        ok = true;
      } catch (e) {
        report.push(
          `FAIL ${st.file} essai ${attempt}: ${e instanceof Error ? e.message : e}`
        );
        await new Promise((res) => setTimeout(res, 1200 * attempt));
      }
    }
  }
  console.log(report.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
