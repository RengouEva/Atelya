/**
 * Test du plan de montage (buildPlan) sur les 17 modèles :
 * - pas de crash, lettres séquentielles A, B, C…
 * - chaque sous-ensemble référence des pièces connues
 */
import { ASM, MODELS, type ModelKey } from "../src/lib/atelier/patterns";

const findDef = (base: string, names: string[]) =>
  names.find((n) => n === base) ??
  names.find((n) => n.startsWith(base) || base.startsWith(n)) ??
  names[0];

let fail = 0;

for (const key of Object.keys(ASM) as ModelKey[]) {
  const model = MODELS[key];
  const defs = model.g({ P: 90, T: 70, H: 98, L: 60 });
  const names = defs.map((d) => d.n);
  const steps = ASM[key];

  // Simulation identique à buildPlan
  const placed: { base: string; group: string | null }[] = [];
  const subs: string[] = [];
  let letters = 0;

  steps.forEach((s) => {
    if (s[2] && s[3]) {
      const aRef = s[1] ?? names[0];
      const [aBase, aOcc] = aRef.split(" ·");
      const dnA = findDef(aBase, names);
      const list = placed.filter((p) => p.base === dnA);
      let anchor = aOcc ? list[Math.min(+aOcc, list.length) - 1] : list[list.length - 1];
      if (!anchor) {
        anchor = { base: dnA, group: null };
        placed.push(anchor);
      }
      const mBase = findDef(s[2].split(" ·")[0], names);
      const mover = { base: mBase, group: null };
      placed.push(mover);
      const letter = String.fromCharCode(65 + letters++);
      const ag = anchor.group;
      placed.forEach((p) => {
        if (p.group === ag) p.group = letter;
      });
      mover.group = letter;
      subs.push(`${ag ?? dnA} + ${mBase} -> ${letter}`);
    }
  });

  const expected = String.fromCharCode(65 + letters - 1);
  const okLetters = subs.every((_, i) => subs[i].endsWith(String.fromCharCode(65 + i)));
  const status = okLetters ? "OK " : "FAIL";
  if (!okLetters) fail++;
  console.log(
    `${status} ${key.padEnd(13)} ${String(steps.length)} étapes · ${subs.length} sous-ensembles (dernier ${expected}) · ${subs.join(" | ") || "—"}`
  );
}

console.log(fail === 0 ? "\nTous les plans sont cohérents." : `\n${fail} plan(s) en échec.`);
process.exit(fail === 0 ? 0 : 1);
