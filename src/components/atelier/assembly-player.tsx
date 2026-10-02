"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Scissors,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ASM,
  LETTERS,
  MODELS,
  type AsmStep,
  type Join,
  type Measures,
  type ModelKey,
  type PieceDef,
} from "@/lib/atelier/patterns";
import { PiecePaths } from "@/components/atelier/pieces";
import { MannequinView } from "@/components/atelier/mannequin";

/* ------------------------------------------------------------------ */
/* Moteur de scène : montage cumulatif des pièces                      */
/* ------------------------------------------------------------------ */

interface Inst {
  def: PieceDef;
  di: number;
  occ: number;
  tx: number;
  ty: number;
  sx: 1 | -1;
  sy: 1 | -1;
  step: number;
}

interface SeamMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  step: number;
}

interface Pending {
  def: PieceDef;
  di: number;
  occ: number;
  px: number;
  py: number;
}

interface Scene {
  insts: Inst[];
  seams: SeamMark[];
  pending: Pending[];
  /** ancre de l'étape de jonction active (avec la bonne occurrence) */
  activeAnchor?: Inst;
  box: [number, number, number, number];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const parseRef = (ref: string) => {
  const [base, occ] = ref.split(" ·");
  return { base, occ: occ ? +occ : undefined };
};

const bounds = (i: {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  def: PieceDef;
}) => {
  const x0 = Math.min(i.tx, i.tx + i.sx * i.def.w);
  const x1 = Math.max(i.tx, i.tx + i.sx * i.def.w);
  const y0 = Math.min(i.ty, i.ty + i.sy * i.def.h);
  const y1 = Math.max(i.ty, i.ty + i.sy * i.def.h);
  return { x0, x1, y0, y1 };
};

/** Position cible de la pièce qui rejoint l'ancre (l'ancre ne bouge pas) */
function placeJoin(join: Join, a: Inst, w: number, h: number) {
  const B = bounds(a);
  switch (join) {
    case "ll": // miroir, bord gauche de l'ancre
      return { tx: B.x0, ty: B.y0, sx: -1 as const, sy: 1 as const };
    case "rr": // miroir, bord droit de l'ancre
      return { tx: B.x1 + w, ty: B.y0, sx: -1 as const, sy: 1 as const };
    case "rl": // bord gauche de la pièce sur bord droit de l'ancre
      return { tx: B.x1, ty: B.y0, sx: 1 as const, sy: 1 as const };
    case "tt": // miroir au-dessus (épaules)
      return { tx: B.x0, ty: B.y0, sx: 1 as const, sy: -1 as const };
    case "bt": // en dessous
      return { tx: B.x0, ty: B.y1, sx: 1 as const, sy: 1 as const };
    case "ct": // centré sur la pièce
    default:
      return {
        tx: B.x0 + (B.x1 - B.x0 - w) / 2,
        ty: B.y0 + (B.y1 - B.y0 - h) / 2,
        sx: 1 as const,
        sy: 1 as const,
      };
  }
}

/** Ligne de couture entre l'ancre et la pièce fraîchement posée */
function seamFor(join: Join, a: Inst, w: number, h: number): SeamMark | null {
  const B = bounds(a);
  const yl = Math.min(a.def.h, h);
  const xl = Math.min(a.def.w, w);
  switch (join) {
    case "ll":
      return { x1: B.x0, y1: B.y0, x2: B.x0, y2: B.y0 + yl, step: 0 };
    case "rr":
    case "rl":
      return { x1: B.x1, y1: B.y0, x2: B.x1, y2: B.y0 + yl, step: 0 };
    case "tt":
      return { x1: B.x0, y1: B.y0, x2: B.x0 + xl, y2: B.y0, step: 0 };
    case "bt":
      return { x1: B.x0, y1: B.y1, x2: B.x0 + xl, y2: B.y1, step: 0 };
    default:
      return null;
  }
}

/**
 * Construit la scène :
 * - `placed` étapes posées (0..placed-1) ;
 * - `activeJoin` : si ≥ 0, garantit l'ancre de cette étape (sans poser la pièce mobile) ;
 * - `prepIdx` : si ≥ 0, pose la pièce de préparation pour la surligner.
 */
function buildScene(
  defs: PieceDef[],
  steps: AsmStep[],
  placed: number,
  activeJoin: number,
  prepIdx: number
): Scene {
  const insts: Inst[] = [];
  const seams: SeamMark[] = [];
  const occ: Record<string, number> = {};
  const scene: Scene = { insts, seams, pending: [], box: [0, 0, 30, 30] };

  const findDef = (base: string) =>
    defs.find((d) => d.n === base) ??
    defs.find((d) => d.n.startsWith(base) || base.startsWith(d.n)) ??
    defs[0];

  const anchorFor = (ref: string): Inst | undefined => {
    const { base, occ: o } = parseRef(ref);
    const dn = findDef(base).n;
    const list = insts.filter((i) => i.def.n === dn);
    if (list.length === 0) return undefined;
    return o ? list[Math.min(o, list.length) - 1] : list[list.length - 1];
  };

  const freeSpot = () => ({
    x: insts.reduce((m, i2) => Math.max(m, bounds(i2).x1), 0) + 8,
    y: insts.length ? Math.min(...insts.map((i2) => bounds(i2).y0)) : 0,
  });

  const place = (
    def: PieceDef,
    tx: number,
    ty: number,
    sx: 1 | -1,
    sy: 1 | -1,
    step: number
  ) => {
    const di = defs.indexOf(def);
    const o = (occ[def.n] ?? 0) + 1;
    occ[def.n] = o;
    const inst: Inst = { def, di, occ: o, tx, ty, sx, sy, step };
    insts.push(inst);
    return inst;
  };

  const placeStep = (i: number) => {
    const s = steps[i];
    if (!s) return;
    if (s[2] && s[3]) {
      const aRef = s[1] ?? defs[0].n;
      const a =
        anchorFor(aRef) ?? place(findDef(parseRef(aRef).base), 0, 0, 1, 1, i);
      const md = findDef(parseRef(s[2]).base);
      const p = placeJoin(s[3], a, md.w, md.h);
      place(md, p.tx, p.ty, p.sx, p.sy, i);
      const sm = seamFor(s[3], a, md.w, md.h);
      if (sm) seams.push({ ...sm, step: i });
    } else if (s[1]) {
      if (!anchorFor(s[1])) {
        const d = findDef(parseRef(s[1]).base);
        const spot = freeSpot();
        place(d, spot.x, spot.y, 1, 1, i);
      }
    }
  };

  for (let i = 0; i < placed && i < steps.length; i++) placeStep(i);

  /* ancre de l'étape de jonction active */
  if (activeJoin >= 0 && steps[activeJoin]) {
    const s = steps[activeJoin];
    const aRef = s[1] ?? defs[0].n;
    scene.activeAnchor =
      anchorFor(aRef) ?? place(findDef(parseRef(aRef).base), 0, 0, 1, 1, activeJoin);
  }

  /* pièce de préparation visible et surlignée */
  if (prepIdx >= 0) placeStep(prepIdx);

  /* pièces en attente : occurrences requises pas encore posées */
  const needCount: Record<string, number> = {};
  const anchorBases = new Set<string>();
  steps.forEach((st) => {
    if (st[2] && st[3]) {
      const b = findDef(parseRef(st[2]).base).n;
      needCount[b] = (needCount[b] ?? 0) + 1;
      anchorBases.add(findDef(parseRef(st[1] ?? defs[0].n).base).n);
    } else if (st[1]) {
      anchorBases.add(findDef(parseRef(st[1]).base).n);
    }
  });
  anchorBases.forEach((b) => {
    needCount[b] = Math.max(needCount[b] ?? 0, 1);
  });

  const pending: Pending[] = [];
  const bx0 = insts.length ? Math.min(...insts.map((i) => bounds(i).x0)) : 0;
  const bx1 = insts.length ? Math.max(...insts.map((i) => bounds(i).x1)) : 0;
  const by0 = insts.length ? Math.min(...insts.map((i) => bounds(i).y0)) : 0;

  defs.forEach((d) => {
    const want = needCount[d.n] ?? 0;
    const have = occ[d.n] ?? 0;
    for (let k = have + 1; k <= want; k++) {
      pending.push({
        def: d,
        di: defs.indexOf(d),
        occ: k,
        px: bx1 + 8,
        py: by0 + pending.reduce((acc, p) => acc + p.def.h + 5, 0),
      });
    }
  });
  scene.pending = pending;

  /* boîte englobante */
  let X0 = bx0;
  let X1 = bx1;
  let Y0 = by0;
  let Y1 = insts.length ? Math.max(...insts.map((i) => bounds(i).y1)) : 0;
  pending.forEach((p) => {
    X1 = Math.max(X1, p.px + p.def.w);
    Y0 = Math.min(Y0, p.py);
    Y1 = Math.max(Y1, p.py + p.def.h);
  });
  if (insts.length === 0 && pending.length === 0) {
    X1 = 30;
    Y1 = 30;
  }
  scene.box = [X0 - 6, Y0 - 6, X1 + 6, Y1 + 6];
  return scene;
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ------------------------------------------------------------------ */
/* Rendu d'une ligne de couture + points                               */
/* ------------------------------------------------------------------ */

function Seam({ s, strong }: { s: SeamMark; strong?: boolean }) {
  const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
  const n = Math.max(3, Math.round(len / 2.4));
  const dots = Array.from({ length: n - 1 }, (_, i) => {
    const t = (i + 1) / n;
    return [lerp(s.x1, s.x2, t), lerp(s.y1, s.y2, t)] as const;
  });
  return (
    <g opacity={strong ? 1 : 0.45}>
      <line
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        stroke="var(--primary)"
        strokeWidth={strong ? 0.6 : 0.45}
        strokeDasharray="1.2 0.9"
        strokeLinecap="round"
      />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={strong ? 0.34 : 0.26} fill="var(--primary)" />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Lecteur d'assemblage                                                */
/* ------------------------------------------------------------------ */

export function AssemblyPlayer({
  modelKey,
  m,
  defs,
  fc,
  sa,
  step,
  onStep,
  resetKey,
}: {
  modelKey: ModelKey;
  m: Measures;
  defs: PieceDef[];
  fc: string;
  sa: number;
  step: number;
  onStep: (s: number) => void;
  resetKey: string;
}) {
  const steps = ASM[modelKey];
  const finalIdx = steps.length;
  const [runId, setRunId] = React.useState(0);
  const [prog, setProg] = React.useState(1);

  const idx = Math.max(0, Math.min(step, finalIdx));
  const isFinal = idx === finalIdx;
  const s = steps[Math.min(idx, steps.length - 1)];
  const model = MODELS[modelKey];
  const isJoinStep = !isFinal && !!s?.[2] && !!s?.[3];

  /* scène : étapes posées + ancre active (jonction) ou pièce de préparation */
  const scene = React.useMemo(
    () =>
      buildScene(
        defs,
        steps,
        isJoinStep ? idx : Math.min(idx + 1, steps.length),
        isJoinStep ? idx : -1,
        isJoinStep ? -1 : idx
      ),
    [defs, steps, idx, isJoinStep, steps.length]
  );

  /* pièce mobile de l'étape active */
  const moverDef = React.useMemo(() => {
    if (!isJoinStep) return null;
    const { base } = parseRef(s[2]);
    return defs.find((d) => d.n === base) ?? defs[0];
  }, [isJoinStep, s, defs]);

  const fromPos = React.useMemo(() => {
    if (!moverDef) return null;
    return scene.pending.find((p) => p.def.n === moverDef.n) ?? null;
  }, [moverDef, scene]);

  React.useEffect(() => {
    if (isFinal) return;
    let raf = 0;
    setProg(0);
    const t0 = performance.now();
    const loop = (now: number) => {
      const p = Math.min(1, (now - t0) / 900);
      setProg(easeInOut(p));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [idx, runId, resetKey, modelKey, isFinal]);

  /* navigation clavier */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && idx < finalIdx) onStep(idx + 1);
      if (e.key === "ArrowLeft" && idx > 0) onStep(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, finalIdx, onStep]);

  const replay = () => setRunId((v) => v + 1);

  /* interpolation de la pièce mobile : point d'attente → position finale */
  let moverXf = "";
  const target =
    moverDef && scene.activeAnchor
      ? placeJoin(s[3] as Join, scene.activeAnchor, moverDef.w, moverDef.h)
      : null;
  if (moverDef && fromPos && target) {
    moverXf = `translate(${r1(lerp(fromPos.px, target.tx, prog))} ${r1(lerp(fromPos.py, target.ty, prog))}) scale(${r1(lerp(1, target.sx, prog))} ${r1(lerp(1, target.sy, prog))})`;
  }

  /* couture fraîche de l'étape active */
  const activeSeam =
    moverDef && target && prog > 0.85 && scene.activeAnchor
      ? (() => {
          const sm = seamFor(
            s[3] as Join,
            scene.activeAnchor as Inst,
            moverDef.w,
            moverDef.h
          );
          return sm ? { ...sm, step: idx } : null;
        })()
      : null;

  /* pièce surlignée en préparation */
  const hlInst =
    !isFinal && !isJoinStep && s?.[1]
      ? scene.insts
          .filter(
            (i) =>
              i.def.n ===
              (defs.find((d) => d.n === parseRef(s[1] as string).base)?.n ?? "")
          )
          .slice(-1)[0]
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-[var(--table)]">
        {isFinal ? (
          <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-[var(--table)] to-background px-4 py-5">
            <MannequinView
              m={m}
              modelKey={modelKey}
              fc={fc}
              className="h-[320px] w-auto max-w-full"
              label={`Produit fini : ${model.n} sur mannequin`}
            />
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Produit fini — {model.n} porté sur mannequin
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {model.tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="rounded-full bg-accent px-2.5 text-[11px] font-medium text-accent-foreground"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <svg
            viewBox={scene.box.map(r1).join(" ")}
            className="block w-full"
            style={{ height: 290 }}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Montage, étape ${idx + 1}`}
          >
            {/* pièces déjà assemblées */}
            {scene.insts.map((inst, k) => (
              <g key={`p${k}`}>
                <g
                  transform={`translate(${r1(inst.tx)} ${r1(inst.ty)}) scale(${inst.sx} ${inst.sy})`}
                >
                  <PiecePaths p={inst.def} fc={fc} sa={sa} />
                </g>
                <text
                  x={r1(inst.tx + (inst.sx * inst.def.w) / 2)}
                  y={r1(inst.ty + (inst.sy * inst.def.h) / 2 + 1)}
                  fontSize={Math.max(2.4, Math.min(inst.def.w, inst.def.h) / 8)}
                  textAnchor="middle"
                  fill="#232B45"
                  fillOpacity=".8"
                  fontFamily="var(--font-sans)"
                  fontWeight={700}
                  stroke="#fff"
                  strokeWidth=".4"
                  style={{ paintOrder: "stroke" }}
                  opacity={hlInst === inst ? 1 : 0.85}
                >
                  {LETTERS[inst.di]}
                  {scene.insts.filter((x) => x.di === inst.di).length > 1
                    ? `·${inst.occ}`
                    : ""}
                </text>
                {hlInst === inst && (
                  <rect
                    x={r1(
                      Math.min(inst.tx, inst.tx + inst.sx * inst.def.w) - 1.2
                    )}
                    y={r1(
                      Math.min(inst.ty, inst.ty + inst.sy * inst.def.h) - 1.2
                    )}
                    width={r1(inst.def.w + 2.4)}
                    height={r1(inst.def.h + 2.4)}
                    rx="1.4"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth=".5"
                    strokeDasharray="1.4 1"
                    className="asm-hl"
                  />
                )}
              </g>
            ))}

            {/* coutures des étapes précédentes */}
            {scene.seams
              .filter((sm) => sm.step < idx - 1)
              .map((sm, k) => (
                <Seam key={`s${k}`} s={sm} />
              ))}

            {/* pièce en attente qui vient se joindre (animée) */}
            {moverDef && fromPos && (
              <g transform={moverXf}>
                <PiecePaths p={moverDef} fc={fc} sa={sa} opacity={0.9} />
              </g>
            )}

            {/* couture fraîche, numérotée */}
            {activeSeam && (
              <>
                <Seam s={activeSeam} strong />
                {(() => {
                  const mx = (activeSeam.x1 + activeSeam.x2) / 2;
                  const my = (activeSeam.y1 + activeSeam.y2) / 2;
                  return (
                    <g>
                      <circle cx={mx} cy={my} r="1.7" fill="var(--primary)" />
                      <text
                        x={mx}
                        y={my + 0.7}
                        fontSize="2"
                        textAnchor="middle"
                        fill="#fff"
                        fontFamily="var(--font-sans)"
                        fontWeight={700}
                      >
                        {idx + 1}
                      </text>
                    </g>
                  );
                })()}
              </>
            )}

            {/* pièces en attente */}
            {scene.pending.map((p, k) => (
              <motion.g
                key={`w${k}`}
                transform={`translate(${r1(p.px)} ${r1(p.py)})`}
                initial={{ opacity: 0.25 }}
                animate={{ opacity: [0.22, 0.42, 0.22] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <PiecePaths p={p.def} fc={fc} sa={sa} seam={false} />
                <text
                  x={r1(p.def.w / 2)}
                  y={r1(p.def.h / 2 + 1)}
                  fontSize={Math.max(2.4, Math.min(p.def.w, p.def.h) / 8)}
                  textAnchor="middle"
                  fill="#232B45"
                  fontFamily="var(--font-sans)"
                  fontWeight={600}
                >
                  {LETTERS[p.di]}
                  {p.occ > 1 ? `·${p.occ}` : ""}
                </text>
              </motion.g>
            ))}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isFinal ? (
            <span className="font-semibold text-foreground">
              Produit fini — le vêtement porté
            </span>
          ) : (
            <>
              <span className="font-semibold text-foreground">
                Montage {idx + 1} sur {steps.length}
              </span>{" "}
              — suivez les numéros de couture
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {steps.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Montage ${i + 1}`}
              onClick={() => onStep(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-7 bg-primary"
                  : "w-2.5 bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
          <button
            role="tab"
            aria-selected={isFinal}
            aria-label="Produit fini sur mannequin"
            onClick={() => onStep(finalIdx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isFinal
                ? "w-7 bg-primary"
                : "w-2.5 bg-border hover:bg-muted-foreground/50"
            }`}
          />
        </div>
      </div>

      <p className="text-[15px] leading-relaxed">
        {isFinal
          ? `Voici ${model.n} terminé et porté : ${model.desc.toLowerCase()} Tissu conseillé : ${model.fab}.`
          : s[0]}
      </p>

      {!isFinal && s[4] && (
        <p className="flex items-start gap-2 rounded-xl border border-primary/25 bg-accent/50 px-3.5 py-2.5 text-[13px] leading-snug text-accent-foreground">
          <Scissors className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            <b>Couture n°{idx + 1}</b> — {s[4]}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => onStep(idx - 1)}
          disabled={idx === 0}
          className="rounded-lg"
        >
          <ChevronLeft className="size-4" /> Précédent
        </Button>
        <Button
          onClick={() => onStep(idx + 1)}
          disabled={isFinal}
          className="rounded-lg"
        >
          {idx === finalIdx - 1 ? "Voir le produit fini" : "Suivant"}
          <ChevronRight className="size-4" />
        </Button>
        {!isFinal && (
          <Button variant="outline" onClick={replay} className="rounded-lg">
            <RotateCw className="size-4" /> Rejouer
          </Button>
        )}
      </div>
    </div>
  );
}
