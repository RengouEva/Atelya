"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Footprints,
  Hand,
  Lightbulb,
  ListTree,
  RotateCw,
  Scissors,
  Sparkles,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

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
import { PiecePaths, PieceTag } from "@/components/atelier/pieces";
import { MannequinView } from "@/components/atelier/mannequin";
import { cn } from "@/lib/utils";

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
  activeAnchor?: Inst;
  box: [number, number, number, number];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
    case "ll":
      return { tx: B.x0, ty: B.y0, sx: -1 as const, sy: 1 as const };
    case "rr":
      return { tx: B.x1 + w, ty: B.y0, sx: -1 as const, sy: 1 as const };
    case "rl":
      return { tx: B.x1, ty: B.y0, sx: 1 as const, sy: 1 as const };
    case "tt":
      return { tx: B.x0, ty: B.y0, sx: 1 as const, sy: -1 as const };
    case "tc":
      return {
        tx: B.x0 + (B.x1 - B.x0 - w) / 2,
        ty: B.y0,
        sx: 1 as const,
        sy: -1 as const,
      };
    case "bt":
      return { tx: B.x0, ty: B.y1, sx: 1 as const, sy: 1 as const };
    case "ct":
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
    case "tc":
      return { x1: B.x0, y1: B.y0, x2: B.x0 + xl, y2: B.y0, step: 0 };
    case "bt":
      return { x1: B.x0, y1: B.y1, x2: B.x0 + xl, y2: B.y1, step: 0 };
    default:
      return null;
  }
}

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
        anchorFor(aRef) ??
        (() => {
          // l'ancre n'est pas encore posée : on la pose à un emplacement libre
          const spot = freeSpot();
          return place(findDef(parseRef(aRef).base), spot.x, spot.y, 1, 1, i);
        })();
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

  if (activeJoin >= 0 && steps[activeJoin]) {
    const s = steps[activeJoin];
    const aRef = s[1] ?? defs[0].n;
    scene.activeAnchor =
      anchorFor(aRef) ??
      (() => {
        const spot = freeSpot();
        return place(findDef(parseRef(aRef).base), spot.x, spot.y, 1, 1, activeJoin);
      })();
  }

  if (prepIdx >= 0) placeStep(prepIdx);

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

/* ------------------------------------------------------------------ */
/* Plan de montage : pièces → sous-ensembles A, B, C… → habit final    */
/* ------------------------------------------------------------------ */

interface SubAsm {
  letter: string;
  from: [string, string];
  step: number;
}

interface StepPlan {
  join: boolean;
  sub?: SubAsm;
  pieceRef?: string;
}

function buildPlan(steps: AsmStep[], defs: PieceDef[]): StepPlan[] {
  const plan: StepPlan[] = [];
  const placed: { base: string; group: string | null }[] = [];
  const findDef = (base: string) =>
    defs.find((d) => d.n === base) ??
    defs.find((d) => d.n.startsWith(base) || base.startsWith(d.n)) ??
    defs[0];
  let letters = 0;

  steps.forEach((s, i) => {
    if (s[2] && s[3]) {
      const aRef = s[1] ?? defs[0].n;
      const { base: aBase, occ } = parseRef(aRef);
      const dnA = findDef(aBase).n;
      const list = placed.filter((p) => p.base === dnA);
      let anchor = occ ? list[Math.min(occ, list.length) - 1] : list[list.length - 1];
      if (!anchor) {
        anchor = { base: dnA, group: null };
        placed.push(anchor);
      }
      const mBase = findDef(parseRef(s[2]).base).n;
      const mover: { base: string; group: string | null } = { base: mBase, group: null };
      placed.push(mover);
      const letter = String.fromCharCode(65 + letters++);
      const anchorGroup = anchor.group;
      placed.forEach((p) => {
        if (p.group === anchorGroup) p.group = letter;
      });
      mover.group = letter;
      plan.push({ join: true, sub: { letter, from: [anchorGroup ?? dnA, mBase], step: i } });
    } else {
      plan.push({ join: false, pieceRef: s[1] });
    }
  });
  return plan;
}

function seamType(s: AsmStep): string {
  const t = `${s[0]} ${s[4] ?? ""}`.toLowerCase();
  if (s[2]) return /ceinture/.test(t) ? "Ceinture" : "Assemblage";
  if (/pince/.test(t)) return "Pince";
  if (/plis/.test(t)) return "Plis";
  if (/fermez|côtés|milieu dos/.test(t)) return "Montage";
  if (/ourlet|roulott/.test(t)) return "Ourlet";
  if (/surpiqu|goutti|fermeture|fente/.test(t)) return "Finitions";
  return "Préparation";
}

function seamValue(s: AsmStep): string {
  const m = `${s[4] ?? ""} ${s[0]}`.match(/(\d+(?:[.,]\d+)?)\s*cm/);
  return m ? `${m[1].replace(".", ",")} cm` : "1 cm";
}

/* ------------------------------------------------------------------ */
/* Rendu SVG : coutures, zones, épingles, aiguille                     */
/* ------------------------------------------------------------------ */

function SeamLocked({ s, strong }: { s: SeamMark; strong?: boolean }) {
  return (
    <g opacity={strong ? 1 : 0.5}>
      {/* ombre du pli de couture */}
      <line
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        stroke="#0c1533"
        strokeOpacity=".2"
        strokeWidth=".9"
        strokeLinecap="round"
      />
      {/* surpiqûre or façon topstitch */}
      <line
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        stroke="var(--gold-deep)"
        strokeWidth=".5"
        strokeDasharray="1.05 .72"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Couture fraîche (or) — de x1,y1 jusqu'à t */
function SeamFresh({ s, t }: { s: SeamMark; t: number }) {
  const x2 = lerp(s.x1, s.x2, t);
  const y2 = lerp(s.y1, s.y2, t);
  const len = Math.hypot(x2 - s.x1, y2 - s.y1);
  const n = Math.max(1, Math.round(len / 2.2));
  const dots = Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n;
    return [lerp(s.x1, x2, u), lerp(s.y1, y2, u)] as const;
  });
  return (
    <g>
      <line
        x1={s.x1}
        y1={s.y1}
        x2={x2}
        y2={y2}
        stroke="var(--gold-deep)"
        strokeWidth="0.62"
        strokeDasharray="1.1 0.8"
        strokeLinecap="round"
      />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.3" fill="var(--gold-deep)" />
      ))}
    </g>
  );
}

/** Zone de couture : marge surlignée de part et d'autre de la ligne */
function SeamZone({
  s,
  sa,
  active,
  pulse,
}: {
  s: SeamMark;
  sa: number;
  active: boolean;
  pulse?: boolean;
}) {
  const vertical = Math.abs(s.x2 - s.x1) < 0.01;
  const pad = 1.2;
  const common = {
    fill: "var(--primary)",
    fillOpacity: active ? 0.18 : 0.1,
    rx: 0.8,
    className: pulse ? "asm-hl" : undefined,
  };
  if (vertical) {
    const y0 = Math.min(s.y1, s.y2) - pad;
    const h = Math.abs(s.y2 - s.y1) + 2 * pad;
    return (
      <g>
        <rect x={s.x1 - sa} y={y0} width={2 * sa} height={h} {...common} />
        <line x1={s.x1 - sa} y1={y0} x2={s.x1 - sa} y2={y0 + h} stroke="var(--primary)" strokeOpacity=".4" strokeWidth=".3" strokeDasharray="1.6 1.1" />
        <line x1={s.x1 + sa} y1={y0} x2={s.x1 + sa} y2={y0 + h} stroke="var(--primary)" strokeOpacity=".4" strokeWidth=".3" strokeDasharray="1.6 1.1" />
      </g>
    );
  }
  const x0 = Math.min(s.x1, s.x2) - pad;
  const w = Math.abs(s.x2 - s.x1) + 2 * pad;
  return (
    <g>
      <rect x={x0} y={s.y1 - sa} width={w} height={2 * sa} {...common} />
      <line x1={x0} y1={s.y1 - sa} x2={x0 + w} y2={s.y1 - sa} stroke="var(--primary)" strokeOpacity=".4" strokeWidth=".3" strokeDasharray="1.6 1.1" />
      <line x1={x0} y1={s.y1 + sa} x2={x0 + w} y2={s.y1 + sa} stroke="var(--primary)" strokeOpacity=".4" strokeWidth=".3" strokeDasharray="1.6 1.1" />
    </g>
  );
}

/** Épingles numérotées le long de la zone */
function Pins({ s }: { s: SeamMark }) {
  return (
    <g>
      {[0.15, 0.5, 0.85].map((t, i) => {
        const x = lerp(s.x1, s.x2, t);
        const y = lerp(s.y1, s.y2, t);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="1.15" fill="var(--card)" stroke="var(--primary)" strokeWidth=".35" />
            <text
              x={x}
              y={y + 0.55}
              fontSize="1.5"
              textAnchor="middle"
              fill="var(--primary)"
              fontFamily="var(--font-sans)"
              fontWeight={700}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Chevrons de sens de couture */
function DirectionHints({ s }: { s: SeamMark }) {
  const ang = (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
  return (
    <g opacity=".8">
      {[0.3, 0.55, 0.78].map((t, i) => {
        const x = lerp(s.x1, s.x2, t);
        const y = lerp(s.y1, s.y2, t);
        return (
          <g key={i} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})`}>
            <path d="M-0.7 -0.9 L0.5 0 L-0.7 0.9" fill="none" stroke="var(--gold-deep)" strokeWidth=".4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}

/** Aiguille dorée posée sur la ligne */
function Needle({ x, y, ang }: { x: number; y: number; ang: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})`}>
      <line x1="0" y1="-1.7" x2="0" y2="1.7" stroke="var(--gold-deep)" strokeWidth=".5" strokeLinecap="round" />
      <circle cx="0" cy="-1.15" r=".42" fill="none" stroke="var(--gold-deep)" strokeWidth=".32" />
    </g>
  );
}

/** Badge sous-ensemble A, B, C… */
function SubBadgeSvg({ x, y, letter }: { x: number; y: number; letter: string }) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`translate(${r1(x)} ${r1(y)})`}>
        <rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1.3" fill="#F0C243" stroke="#fff" strokeWidth=".4" />
        <text x="0" y="1" fontSize="3" textAnchor="middle" fill="#12224e" fontFamily="var(--font-sans)" fontWeight={800}>
          {letter}
        </text>
      </g>
    </motion.g>
  );
}

/** Numéro de couture verrouillée */
function NumBadge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="1.7" fill="var(--primary)" />
      <text x={x} y={y + 0.7} fontSize="2" textAnchor="middle" fill="#fff" fontFamily="var(--font-sans)" fontWeight={700}>
        {n}
      </text>
    </g>
  );
}

/** Étincelles de fin de couture */
function SparkleBurst({ x, y }: { x: number; y: number }) {
  const pts = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${r1(x)} ${r1(y)})`}>
      <motion.g
        initial={{ scale: 0.3, opacity: 0.95 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        {pts.map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle key={a} cx={r1(Math.cos(rad) * 2.1)} cy={r1(Math.sin(rad) * 2.1)} r="0.55" fill="var(--gold)" />
          );
        })}
      </motion.g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Plan de montage (arbre) + fiche couture                             */
/* ------------------------------------------------------------------ */

function SubChip({ letter }: { letter: string }) {
  return (
    <span
      className="grid size-[22px] shrink-0 place-items-center rounded-md bg-gradient-to-br from-[#F0C243] to-[#E09A12] text-[11px] font-extrabold text-[#12224e] shadow-sm"
      aria-label={`Sous-ensemble ${letter}`}
    >
      {letter}
    </span>
  );
}

function Chip({ label }: { label: string }) {
  if (/^[A-Z]$/.test(label)) return <SubChip letter={label} />;
  return (
    <span className="max-w-[92px] truncate rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
      {label.length > 13 ? `${label.slice(0, 12)}…` : label}
    </span>
  );
}

function PlanTree({
  plan,
  steps,
  idx,
  isFinal,
  completed,
}: {
  plan: StepPlan[];
  steps: AsmStep[];
  idx: number;
  isFinal: boolean;
  completed: boolean[];
}) {
  const allJoinDone = plan.every((p, i) => !p.join || completed[i]);
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        <ListTree className="size-3.5" />
        Plan de montage
      </p>
      <ol className="flex flex-col gap-1">
        {steps.map((s, i) => {
          const p = plan[i];
          const state = completed[i] ? "done" : i === idx && !isFinal ? "cur" : "todo";
          if (p.join && p.sub) {
            return (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] leading-none",
                  state === "cur" && "bg-primary/5 ring-1 ring-primary/30",
                  state === "todo" && "opacity-55"
                )}
              >
                <Chip label={p.sub.from[0]} />
                <span className="text-muted-foreground">+</span>
                <Chip label={p.sub.from[1]} />
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                <SubChip letter={p.sub.letter} />
                {state === "done" && (
                  <Check className="ml-auto size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                {state === "cur" && (
                  <span className="asm-hl ml-auto size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                )}
              </li>
            );
          }
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground",
                state === "todo" && "opacity-55"
              )}
            >
              <Scissors className="size-3 shrink-0" />
              <span className="truncate">
                {(() => {
                  const t = s[4] ?? s[0];
                  return t.length > 44 ? `${t.slice(0, 43)}…` : t;
                })()}
              </span>
              {state === "done" && (
                <Check className="ml-auto size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
            </li>
          );
        })}
        <li
          className={cn(
            "mt-0.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-bold",
            isFinal || allJoinDone
              ? "bg-accent text-accent-foreground"
              : "opacity-55"
          )}
        >
          <Sparkles className="size-3.5 shrink-0 text-gold-deep dark:text-gold" />
          Habit final
          {(isFinal || allJoinDone) && (
            <Check className="ml-auto size-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
        </li>
      </ol>
    </div>
  );
}

function FicheCouture({ s, idx }: { s: AsmStep; idx: number }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-accent/50 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
        Fiche couture n°{idx + 1}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed">{s[0]}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {[seamType(s), `Marge ${seamValue(s)}`, "Point droit 2,5 mm", "3 épingles", s[2] ? "Endroit contre endroit" : ""]
          .filter(Boolean)
          .map((b) => (
            <Badge key={b} variant="secondary" className="rounded-full bg-card px-2.5 text-[10.5px] font-semibold">
              {b}
            </Badge>
          ))}
      </div>
      {s[4] && (
        <p className="mt-2 border-t border-border/50 pt-2 text-[12px] leading-snug text-muted-foreground">
          {s[4]}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Atelier de couture interactif                                       */
/* ------------------------------------------------------------------ */

type Phase = "place" | "sew" | "done";
interface MoverPos {
  x: number;
  y: number;
  kk: number;
}

function prepSeg(inst: Inst, s: AsmStep, sa: number, idx: number): SeamMark {
  const B = bounds(inst);
  const t = `${s[0]} ${s[4] ?? ""}`.toLowerCase();
  if (/ourlet|roulott/.test(t)) {
    return {
      x1: B.x0 + 1.5,
      y1: B.y1 - sa - 0.4,
      x2: B.x1 - 1.5,
      y2: B.y1 - sa - 0.4,
      step: idx,
    };
  }
  const cx = (B.x0 + B.x1) / 2;
  return {
    x1: cx,
    y1: B.y0 + inst.def.h * 0.22,
    x2: cx,
    y2: B.y0 + inst.def.h * 0.62,
    step: idx,
  };
}

function ctFallbackSeg(t: { tx: number; ty: number }, md: PieceDef, idx: number): SeamMark {
  return {
    x1: t.tx + 0.8,
    y1: t.ty + md.h / 2,
    x2: t.tx + md.w - 0.8,
    y2: t.ty + md.h / 2,
    step: idx,
  };
}

export function SewingStudio({
  modelKey,
  m,
  defs,
  fc,
  sa,
  resetKey,
}: {
  modelKey: ModelKey;
  m: Measures;
  defs: PieceDef[];
  fc: string;
  sa: number;
  resetKey: string;
}) {
  const steps = ASM[modelKey];
  const finalIdx = steps.length;
  const model = MODELS[modelKey];

  const [step, setStep] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("place");
  const [prog, setProg] = React.useState(0);
  const [completed, setCompleted] = React.useState<boolean[]>(() =>
    steps.map(() => false)
  );
  const [help, setHelp] = React.useState(true);
  const [runId, setRunId] = React.useState(0);
  const [moverPos, setMoverPos] = React.useState<MoverPos | null>(null);
  const moverPosRef = React.useRef<MoverPos | null>(null);
  const applyPos = React.useCallback((p: MoverPos | null) => {
    moverPosRef.current = p;
    setMoverPos(p);
  }, []);
  const [dragging, setDragging] = React.useState(false);
  const [pedal, setPedal] = React.useState(false);

  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const animRef = React.useRef<number>(0);
  const dragOff = React.useRef({ ox: 0, oy: 0 });
  const sewingRef = React.useRef(false);

  const idx = Math.max(0, Math.min(step, finalIdx));
  const isFinal = idx === finalIdx;
  const s = steps[Math.min(idx, steps.length - 1)];
  const plan = React.useMemo(() => buildPlan(steps, defs), [steps, defs]);
  const stepInfo = plan[idx];

  const isCompletedStep = !isFinal && completed[idx];
  const isJoin = !isFinal && !isCompletedStep && !!s?.[2] && !!s?.[3];

  const findDefN = React.useCallback(
    (base: string) =>
      defs.find((d) => d.n === base) ??
      defs.find((d) => d.n.startsWith(base) || base.startsWith(d.n)) ??
      defs[0],
    [defs]
  );

  /* scène selon l'état de l'étape */
  const scene = React.useMemo(() => {
    if (isFinal) return null;
    if (isCompletedStep)
      return buildScene(defs, steps, Math.min(idx + 1, steps.length), -1, -1);
    if (isJoin) return buildScene(defs, steps, idx, idx, -1);
    return buildScene(defs, steps, idx, -1, idx);
  }, [defs, steps, idx, isFinal, isCompletedStep, isJoin, steps.length]);

  const moverDef = React.useMemo(
    () => (isJoin ? findDefN(parseRef(s[2] as string).base) : null),
    [isJoin, s, findDefN]
  );
  const anchor = isJoin ? scene?.activeAnchor : undefined;
  const target = React.useMemo(
    () =>
      moverDef && anchor
        ? placeJoin(s[3] as Join, anchor, moverDef.w, moverDef.h)
        : null,
    [moverDef, anchor, s]
  );
  const apartPos = React.useMemo(() => {
    if (!target || !anchor || !moverDef || !s?.[3]) return null;
    const B = bounds(anchor);
    switch (s[3] as Join) {
      case "ll":
        return { x: B.x0 - moverDef.w - 3, y: B.y0, kk: 0 };
      case "rr":
      case "rl":
        return { x: B.x1 + 3, y: B.y0, kk: 0 };
      case "tt":
        return { x: B.x0, y: B.y0 - moverDef.h - 3, kk: 0 };
      case "tc":
        return { x: (target as { tx: number }).tx, y: B.y0 - moverDef.h - 3, kk: 0 };
      case "bt":
        return { x: B.x0, y: B.y1 + 3, kk: 0 };
      default:
        return { x: target.tx, y: target.ty, kk: 0 };
    }
  }, [target, anchor, moverDef, s]);

  /* pièce de préparation (étapes sans jonction) */
  const prepInst = React.useMemo(() => {
    if (isFinal || isCompletedStep || isJoin || !stepInfo?.pieceRef) return undefined;
    const { base } = parseRef(stepInfo.pieceRef);
    const dn = findDefN(base).n;
    const list = scene?.insts.filter((i) => i.def.n === dn) ?? [];
    return list[list.length - 1] ?? scene?.insts[scene.insts.length - 1];
  }, [isFinal, isCompletedStep, isJoin, stepInfo, scene, findDefN]);

  /* segment de couture actif */
  const seg = React.useMemo(() => {
    if (isFinal) return null;
    if (isCompletedStep) return scene?.seams.find((sm) => sm.step === idx) ?? null;
    if (isJoin && anchor && moverDef && target) {
      const sm = seamFor(s[3] as Join, anchor, moverDef.w, moverDef.h);
      return sm ? { ...sm, step: idx } : ctFallbackSeg(target, moverDef, idx);
    }
    if (!isJoin && prepInst) return prepSeg(prepInst, s, sa, idx);
    return null;
  }, [isFinal, isCompletedStep, scene, idx, isJoin, anchor, moverDef, target, s, sa, prepInst]);

  /* position du badge sous-ensemble */
  const badgePos = React.useMemo(() => {
    if (!seg) return null;
    const vertical = Math.abs(seg.x2 - seg.x1) < 0.01;
    return {
      x: vertical ? seg.x1 : (seg.x1 + seg.x2) / 2,
      y: Math.min(seg.y1, seg.y2) - 3.4,
    };
  }, [seg]);

  /* reset de la pièce mobile à chaque changement d'étape */
  React.useEffect(() => {
    if (isFinal || isCompletedStep || phase !== "place") {
      if (phase !== "place") return;
      applyPos(null);
      return;
    }
    applyPos(apartPos);
  }, [idx, runId, resetKey, isFinal, isCompletedStep, apartPos, phase, applyPos]);

  /* pédale : coudre en maintenant */
  React.useEffect(() => {
    if (!pedal || phase !== "sew") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProg((p) => Math.min(1, p + dt * 0.4));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pedal, phase]);

  const completeStep = React.useCallback(() => {
    setCompleted((prev) => {
      const n = [...prev];
      n[idx] = true;
      return n;
    });
    setPhase("done");
    setPedal(false);
    applyPos(null);
    const sub = plan[idx]?.sub;
    toast.success(
      sub
        ? `Couture n°${idx + 1} terminée — sous-ensemble ${sub.letter} assemblé`
        : `Couture n°${idx + 1} terminée`
    );
  }, [idx, plan]);

  React.useEffect(() => {
    if (phase === "sew" && prog >= 0.97) completeStep();
  }, [prog, phase, completeStep]);

  const goto = React.useCallback(
    (n: number) => {
      const c = Math.max(0, Math.min(n, finalIdx));
      setStep(c);
      setPedal(false);
      setProg(0);
      setRunId((v) => v + 1);
      if (c >= finalIdx) {
        setPhase("done");
        applyPos(null);
      } else if (completed[c]) {
        setPhase("done");
        applyPos(null);
      } else {
        setPhase("place");
        applyPos(null);
      }
    },
    [completed, finalIdx, applyPos]
  );

  const resetAll = React.useCallback(() => {
    setCompleted(steps.map(() => false));
    setStep(0);
    setPhase("place");
    setProg(0);
    applyPos(null);
    setRunId((v) => v + 1);
  }, [steps, applyPos]);

  /* navigation clavier */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && idx < finalIdx) goto(idx + 1);
      if (e.key === "ArrowLeft" && idx > 0) goto(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, finalIdx, goto]);

  React.useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const animateMover = React.useCallback(
    (from: MoverPos, to: MoverPos, ms: number, cb?: () => void) => {
      cancelAnimationFrame(animRef.current);
      const t0 = performance.now();
      const loop = (now: number) => {
        const k = easeInOut(Math.min(1, (now - t0) / ms));
        applyPos({
          x: lerp(from.x, to.x, k),
          y: lerp(from.y, to.y, k),
          kk: lerp(from.kk, to.kk, k),
        });
        if (k < 1) animRef.current = requestAnimationFrame(loop);
        else cb?.();
      };
      animRef.current = requestAnimationFrame(loop);
    },
    [applyPos]
  );

  const assemble = React.useCallback(() => {
    if (!target || !moverPos) return;
    animateMover(moverPos, { x: target.tx, y: target.ty, kk: 1 }, 620, () =>
      setPhase("sew")
    );
  }, [target, moverPos, animateMover]);

  /* conversion écran → coordonnées SVG */
  const toSvgPoint = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const m2 = svg.getScreenCTM();
    if (!m2) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m2.inverse());
  };

  const projectT = (p: DOMPoint, sm: SeamMark) => {
    const dx = sm.x2 - sm.x1;
    const dy = sm.y2 - sm.y1;
    const L2 = dx * dx + dy * dy || 1;
    return Math.max(0, Math.min(1, ((p.x - sm.x1) * dx + (p.y - sm.y1) * dy) / L2));
  };

  const sewTo = (e: React.PointerEvent) => {
    if (!seg) return;
    const p = toSvgPoint(e);
    if (!p) return;
    setProg((pr) => Math.max(pr, projectT(p, seg)));
  };

  const onSewDown = (e: React.PointerEvent) => {
    if (phase !== "sew") return;
    sewingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    sewTo(e);
  };
  const onSewMove = (e: React.PointerEvent) => {
    if (sewingRef.current) sewTo(e);
  };
  const onSewUp = () => {
    sewingRef.current = false;
  };

  const onMoverDown = (e: React.PointerEvent) => {
    if (phase !== "place" || !moverPos) return;
    cancelAnimationFrame(animRef.current);
    const p = toSvgPoint(e);
    if (!p) return;
    dragOff.current = { ox: p.x - moverPos.x, oy: p.y - moverPos.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMoverMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const p = toSvgPoint(e);
    if (!p) return;
    applyPos({
      x: p.x - dragOff.current.ox,
      y: p.y - dragOff.current.oy,
      kk: 0,
    });
  };
  const onMoverUp = () => {
    if (!dragging) return;
    setDragging(false);
    const cur = moverPosRef.current;
    if (!cur || !target || !apartPos) return;
    const d = Math.hypot(cur.x - target.tx, cur.y - target.ty);
    if (d < 14)
      animateMover(cur, { x: target.tx, y: target.ty, kk: 1 }, 240, () =>
        setPhase("sew")
      );
    else animateMover(cur, apartPos, 320);
  };

  /* rendu */
  const doneCount = completed.filter(Boolean).length;
  const hideIdx =
    moverDef && !isCompletedStep && !isFinal && stepInfo?.join
      ? (scene?.pending.findIndex((p) => p.def.n === moverDef.n) ?? -1)
      : -1;
  const pendingOthers = (scene?.pending ?? []).filter((_, i) => i !== hideIdx);

  let box: number[] = scene?.box ?? [0, 0, 30, 30];
  if (moverDef && moverPos && !isCompletedStep && !isFinal && stepInfo?.join) {
    const ab = bounds({
      tx: moverPos.x,
      ty: moverPos.y,
      sx: lerp(1, target?.sx ?? 1, moverPos.kk),
      sy: lerp(1, target?.sy ?? 1, moverPos.kk),
      def: moverDef,
    });
    box = [
      Math.min(box[0], ab.x0 - 6),
      Math.min(box[1], ab.y0 - 6),
      Math.max(box[2], ab.x1 + 6),
      Math.max(box[3], ab.y1 + 6),
    ];
  }

  const needleAng = seg
    ? (Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1) * 180) / Math.PI - 90
    : 0;
  const needleX = seg ? lerp(seg.x1, seg.x2, prog) : 0;
  const needleY = seg ? lerp(seg.y1, seg.y2, prog) : 0;

  /* viewBox au format SVG [x, y, largeur, hauteur] */
  const vb = `${r1(box[0])} ${r1(box[1])} ${r1(box[2] - box[0])} ${r1(box[3] - box[1])}`;

  const hint = isFinal
    ? "Toutes les coutures sont réalisées — le vêtement est terminé."
    : phase === "place"
      ? stepInfo?.join
        ? "Faites glisser la pièce surlignée jusqu'à la zone de couture, ou appuyez sur Assembler."
        : "La zone à coudre clignote sur la pièce — appuyez sur Aller à la couture."
      : phase === "sew"
        ? "Glissez le doigt le long de la ligne, de l'épingle 1 à l'épingle 3 — ou maintenez la pédale."
        : stepInfo?.sub
          ? `Sous-ensemble ${stepInfo.sub.letter} créé. Poursuivez le plan de montage.`
          : "Couture verrouillée. Poursuivez le plan de montage.";

  return (
    <div className="flex flex-col gap-4">
      {/* en-tête d'étape */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {isFinal
              ? `Terminé · ${doneCount}/${finalIdx} coutures`
              : `Étape ${idx + 1} sur ${finalIdx} · ${seamType(s)}`}
          </p>
          <p className="font-display text-[16px] font-bold leading-tight">
            {isFinal
              ? "Votre vêtement est terminé"
              : phase === "place"
                ? stepInfo?.join
                  ? "Assemblez les pièces"
                  : "Préparez la pièce"
                : phase === "sew"
                  ? "Cousez la zone surlignée"
                  : "Couture terminée"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          aria-pressed={help}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
            help
              ? "border-gold-deep/40 bg-accent text-accent-foreground"
              : "border-border text-muted-foreground"
          )}
        >
          <Lightbulb className="size-3.5" />
          Aide
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="flex flex-col gap-3">
          {/* scène — table d'atelier */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-[var(--table)] shadow-[inset_0_2px_16px_rgba(12,21,51,0.12)]">
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
                <p className="text-[12.5px] text-muted-foreground">
                  {doneCount} coutures réalisées · zones de couture respectées ·
                  point droit 2,5 mm
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
                ref={svgRef}
                viewBox={vb}
                className="block w-full"
                style={{ height: 300 }}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`Couture, étape ${idx + 1}`}
              >
                {/* tapis de coupe quadrillé (maille 5 cm, accent 10 cm) */}
                <defs>
                  <pattern id="asm-mat5" width="5" height="5" patternUnits="userSpaceOnUse">
                    <rect width="5" height="5" fill="var(--table)" />
                    <path d="M5 0V5H0" fill="none" stroke="var(--foreground)" strokeOpacity=".06" strokeWidth=".12" />
                  </pattern>
                  <pattern id="asm-mat10" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M10 0V10H0" fill="none" stroke="var(--foreground)" strokeOpacity=".08" strokeWidth=".18" />
                  </pattern>
                </defs>
                <rect
                  x={r1(box[0])}
                  y={r1(box[1])}
                  width={r1(box[2] - box[0])}
                  height={r1(box[3] - box[1])}
                  fill="url(#asm-mat5)"
                />
                <rect
                  x={r1(box[0])}
                  y={r1(box[1])}
                  width={r1(box[2] - box[0])}
                  height={r1(box[3] - box[1])}
                  fill="url(#asm-mat10)"
                />

                {/* pièces déjà assemblées */}
                {scene?.insts.map((inst, k) => (
                  <g key={`p${k}`}>
                    <g
                      transform={`translate(${r1(inst.tx)} ${r1(inst.ty)}) scale(${inst.sx} ${inst.sy})`}
                    >
                      <PiecePaths p={inst.def} fc={fc} sa={sa} shadow />
                    </g>
                    <PieceTag
                      x={r1(inst.tx + (inst.sx * inst.def.w) / 2)}
                      y={r1(inst.ty + (inst.sy * inst.def.h) / 2)}
                      label={
                        LETTERS[inst.di] +
                        (scene.insts.filter((x) => x.di === inst.di).length > 1
                          ? `·${inst.occ}`
                          : "")
                      }
                    />
                  </g>
                ))}

                {/* coutures des étapes précédentes */}
                {(scene?.seams ?? [])
                  .filter((sm) => sm.step < idx)
                  .map((sm, k) => (
                    <SeamLocked key={`s${k}`} s={sm} />
                  ))}

                {/* zone de couture active */}
                {seg && phase !== "done" && (
                  <SeamZone s={seg} sa={sa} active={phase === "sew"} pulse={phase === "place"} />
                )}
                {seg && phase !== "done" && (
                  <line
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke="var(--primary)"
                    strokeOpacity=".45"
                    strokeWidth=".35"
                    strokeDasharray="1.2 0.9"
                  />
                )}
                {seg && help && phase !== "done" && <Pins s={seg} />}
                {seg && help && phase === "sew" && <DirectionHints s={seg} />}
                {seg && help && phase === "place" && (
                  <text
                    x={r1(badgePos?.x ?? 0)}
                    y={r1((badgePos?.y ?? 0) - 0.6)}
                    fontSize="2.1"
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fillOpacity=".7"
                    fontFamily="var(--font-sans)"
                    fontWeight={600}
                  >
                    marge {seamValue(s)}
                  </text>
                )}

                {/* pièces en attente — posées à plat sur la table */}
                {pendingOthers.map((p, k) => (
                  <g
                    key={`w${k}`}
                    transform={`translate(${r1(p.px)} ${r1(p.py)})`}
                    opacity=".94"
                  >
                    <PiecePaths p={p.def} fc={fc} sa={sa} shadow />
                    <PieceTag
                      x={r1(p.def.w / 2)}
                      y={r1(p.def.h / 2)}
                      label={LETTERS[p.di] + (p.occ > 1 ? `·${p.occ}` : "")}
                      muted
                    />
                  </g>
                ))}

                {/* pièce mobile à assembler */}
                {moverDef && moverPos && !isCompletedStep && !isFinal && (
                  <g
                    transform={`translate(${r1(moverPos.x)} ${r1(moverPos.y)}) scale(${r1(lerp(1, target?.sx ?? 1, moverPos.kk))} ${r1(lerp(1, target?.sy ?? 1, moverPos.kk))})`}
                    onPointerDown={onMoverDown}
                    onPointerMove={onMoverMove}
                    onPointerUp={onMoverUp}
                    onPointerCancel={onMoverUp}
                    style={{
                      cursor: phase === "place" ? (dragging ? "grabbing" : "grab") : "default",
                      touchAction: "none",
                    }}
                  >
                    <PiecePaths p={moverDef} fc={fc} sa={sa} shadow lifted={dragging} />
                    {phase === "place" && help && (
                      <rect
                        x={-1}
                        y={-1}
                        width={moverDef.w + 2}
                        height={moverDef.h + 2}
                        rx="1.2"
                        fill="none"
                        stroke="var(--gold-deep)"
                        strokeWidth=".45"
                        strokeDasharray="1.6 1.1"
                        className="asm-hl"
                      />
                    )}
                    <PieceTag
                      x={r1(moverDef.w / 2)}
                      y={r1(moverDef.h / 2)}
                      label={LETTERS[defs.indexOf(moverDef)]}
                    />
                  </g>
                )}

                {/* couture en cours (or) + aiguille */}
                {seg && phase === "sew" && prog > 0.005 && (
                  <SeamFresh s={seg} t={prog} />
                )}
                {seg && phase === "sew" && <Needle x={needleX} y={needleY} ang={needleAng} />}

                {/* zone de saisie pour coudre au doigt */}
                {seg && phase === "sew" && (() => {
                  const vertical = Math.abs(seg.x2 - seg.x1) < 0.01;
                  const hit = vertical
                    ? {
                        x: Math.min(seg.x1, seg.x2) - sa - 2,
                        y: Math.min(seg.y1, seg.y2) - 2,
                        w: 2 * sa + 4,
                        h: Math.abs(seg.y2 - seg.y1) + 4,
                      }
                    : {
                        x: Math.min(seg.x1, seg.x2) - 2,
                        y: Math.min(seg.y1, seg.y2) - sa - 2,
                        w: Math.abs(seg.x2 - seg.x1) + 4,
                        h: 2 * sa + 4,
                      };
                  return (
                    <rect
                      x={r1(hit.x)}
                      y={r1(hit.y)}
                      width={r1(hit.w)}
                      height={r1(hit.h)}
                      fill="transparent"
                      style={{ touchAction: "none", cursor: "crosshair" }}
                      onPointerDown={onSewDown}
                      onPointerMove={onSewMove}
                      onPointerUp={onSewUp}
                      onPointerCancel={onSewUp}
                    />
                  );
                })()}

                {/* couture verrouillée + badge */}
                {seg && phase === "done" && !isFinal && (
                  <>
                    <SeamLocked s={seg} strong />
                    <NumBadge
                      x={(seg.x1 + seg.x2) / 2}
                      y={(seg.y1 + seg.y2) / 2}
                      n={idx + 1}
                    />
                  </>
                )}
                {seg && phase === "done" && !isFinal && stepInfo?.sub && badgePos && (
                  <>
                    <SubBadgeSvg x={badgePos.x} y={badgePos.y} letter={stepInfo.sub.letter} />
                    <SparkleBurst key={`sp${idx}-${runId}`} x={badgePos.x} y={badgePos.y} />
                  </>
                )}
              </svg>
            )}
          </div>

          {/* progression de la couture */}
          {phase === "sew" && seg && (
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F0C243] to-[#E09A12] transition-[width] duration-100"
                  style={{ width: `${Math.round(prog * 100)}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs font-bold tabular-nums">
                {Math.round(prog * 100)} %
              </span>
            </div>
          )}

          {/* boutons d'action */}
          <div className="flex flex-wrap items-center gap-2">
            {!isFinal && idx > 0 && (
              <Button variant="outline" onClick={() => goto(idx - 1)} className="rounded-lg">
                <ChevronLeft className="size-4" /> Précédent
              </Button>
            )}
            {phase === "place" &&
              (stepInfo?.join ? (
                <Button onClick={assemble} disabled={!target} className="min-w-[200px] rounded-lg">
                  <Hand className="size-4" /> Assembler les pièces
                </Button>
              ) : (
                <Button onClick={() => setPhase("sew")} className="min-w-[200px] rounded-lg">
                  <ChevronRight className="size-4" /> Aller à la couture
                </Button>
              ))}
            {phase === "sew" && (
              <>
                <Button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setPedal(true);
                  }}
                  onPointerUp={() => setPedal(false)}
                  onPointerLeave={() => setPedal(false)}
                  onPointerCancel={() => setPedal(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={cn(
                    "min-w-[200px] select-none touch-none rounded-lg",
                    pedal && "animate-pulse"
                  )}
                >
                  <Footprints className="size-4" /> Maintenir pour coudre
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProg(0);
                    toast("Couture décousue — repiquez du début");
                  }}
                  className="rounded-lg"
                >
                  <Undo2 className="size-4" /> Découdre
                </Button>
                <Button variant="outline" onClick={completeStep} className="rounded-lg">
                  <FastForward className="size-4" /> Terminer
                </Button>
              </>
            )}
            {phase === "done" && !isFinal && (
              <Button onClick={() => goto(idx + 1)} className="min-w-[200px] rounded-lg">
                {idx === finalIdx - 1 ? "Voir le vêtement fini" : "Couture suivante"}
                <ChevronRight className="size-4" />
              </Button>
            )}
            {isFinal && (
              <>
                <Button variant="outline" onClick={() => goto(idx - 1)} className="rounded-lg">
                  <ChevronLeft className="size-4" /> Revoir les coutures
                </Button>
                <Button onClick={resetAll} variant="outline" className="rounded-lg">
                  <RotateCw className="size-4" /> Rejouer l&apos;assemblage
                </Button>
              </>
            )}
          </div>
          <p className="text-[13px] leading-snug text-muted-foreground">{hint}</p>
        </div>

        {/* plan de montage + fiche */}
        <aside className="flex flex-col gap-3">
          <PlanTree plan={plan} steps={steps} idx={idx} isFinal={isFinal} completed={completed} />
          {!isFinal && <FicheCouture s={s} idx={idx} />}
        </aside>
      </div>
    </div>
  );
}
