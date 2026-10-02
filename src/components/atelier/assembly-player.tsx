"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ASM,
  LETTERS,
  MODELS,
  type Join,
  type Measures,
  type ModelKey,
  type PieceDef,
} from "@/lib/atelier/patterns";
import { PiecePaths } from "@/components/atelier/pieces";
import { GarmentPreview } from "@/components/atelier/garment-preview";

/* ------------------------------------------------------------------ */
/* Paramètres de jonction entre deux pièces                            */
/* ------------------------------------------------------------------ */

interface Xf {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
}

interface JoinGeom {
  a: Xf;
  b: Xf;
  box: [number, number, number, number];
  seam: { x1: number; y1: number; x2: number; y2: number };
}

function computeJoin(
  join: Join,
  W: number,
  H: number,
  w: number,
  k: number,
  sa: number
): JoinGeom {
  const G = 12;
  const M = Math.max(H, k);
  const X = Math.max(W, w);
  switch (join) {
    case "rr":
      return {
        a: { tx: W + w + G, ty: 0, sx: -1, sy: 1 },
        b: { tx: W + w, ty: 0, sx: -1, sy: 1 },
        box: [-sa, -sa, W + w + G + 2 * sa, M + 2 * sa],
        seam: { x1: W, y1: 0, x2: W, y2: Math.min(H, k) },
      };
    case "ll":
      return {
        a: { tx: -G, ty: 0, sx: -1, sy: 1 },
        b: { tx: 0, ty: 0, sx: -1, sy: 1 },
        box: [-w - G - sa, -sa, W + w + G + 2 * sa, M + 2 * sa],
        seam: { x1: 0, y1: 0, x2: 0, y2: Math.min(H, k) },
      };
    case "tt":
      return {
        a: { tx: 0, ty: -G, sx: 1, sy: -1 },
        b: { tx: 0, ty: 0, sx: 1, sy: -1 },
        box: [-sa, -k - G - sa, X + 2 * sa, H + k + G + 2 * sa],
        seam: { x1: 0, y1: 0, x2: Math.min(W, w), y2: 0 },
      };
    case "rl":
      return {
        a: { tx: W + G, ty: 0, sx: 1, sy: 1 },
        b: { tx: W, ty: 0, sx: 1, sy: 1 },
        box: [-sa, -sa, W + w + G + 2 * sa, M + 2 * sa],
        seam: { x1: W, y1: 0, x2: W, y2: Math.min(H, k) },
      };
    case "bt":
    default:
      return {
        a: { tx: 0, ty: -k - G, sx: 1, sy: 1 },
        b: { tx: 0, ty: -k, sx: 1, sy: 1 },
        box: [-sa, -k - G - sa, X + 2 * sa, H + k + G + 2 * sa],
        seam: { x1: 0, y1: 0, x2: Math.min(W, w), y2: 0 },
      };
  }
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const xf = (x: Xf, t: number) =>
  `translate(${lerp(x.a.tx, x.b.tx, t)} ${lerp(x.a.ty, x.b.ty, t)}) scale(${lerp(x.a.sx, x.b.sx, t)} ${lerp(x.a.sy, x.b.sy, t)})`;

/* ------------------------------------------------------------------ */
/* Lecteur d'assemblage (étapes + aperçu final du vêtement)            */
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
  const finalIdx = steps.length; // dernière carte = aperçu du vêtement
  const [runId, setRunId] = React.useState(0);
  const [prog, setProg] = React.useState(1);

  const idx = Math.max(0, Math.min(step, finalIdx));
  const isFinal = idx === finalIdx;
  const s = steps[idx];
  const g = !isFinal ? (defs.find((p) => p.n === s[1]) ?? defs[0]) : null;
  const h = !isFinal && s[2] ? defs.find((p) => p.n === s[2]) : undefined;
  const gi = g ? defs.indexOf(g) : 0;
  const hi = h ? defs.indexOf(h) : -1;

  const geom: JoinGeom | null =
    g && h ? computeJoin(s[3] ?? "rl", g.w, g.h, h.w, h.h, sa) : null;

  const box = geom
    ? [geom.box[0] - 2, geom.box[1] - 2, geom.box[2] + 4, geom.box[3] + 4]
    : [-sa - 2, -sa - 2, g ? g.w + 2 * sa + 4 : 40, g ? g.h + 2 * sa + 4 : 40];

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

  const replay = () => setRunId((v) => v + 1);

  const model = MODELS[modelKey];
  const labelFs = g ? Math.max(2.6, Math.min(g.w, g.h) / 9) : 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-[var(--table)]">
        {isFinal ? (
          <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-[var(--table)] to-background px-4 py-5">
            <GarmentPreview
              m={m}
              modelKey={modelKey}
              fc={fc}
              className="h-[260px] w-auto max-w-full"
              label={`Aperçu final : ${model.n}`}
            />
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Le vêtement obtenu — {model.n}
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
            viewBox={box.join(" ")}
            className="block w-full"
            style={{ height: 250 }}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Assemblage, étape ${idx + 1}`}
          >
            {/* pièce principale */}
            {g && (
              <g>
                <PiecePaths p={g} fc={fc} sa={sa} />
                <text
                  x="1.6"
                  y={3.4}
                  fontSize={labelFs}
                  fill="#232B45"
                  fontFamily="var(--font-sans)"
                  fontWeight={700}
                  stroke="#fff"
                  strokeWidth=".5"
                  style={{ paintOrder: "stroke" }}
                >
                  {LETTERS[gi]} · {g.n}
                </text>
              </g>
            )}

            {/* pièce mobile qui vient se joindre */}
            {g && h && geom && (
              <g transform={xf(geom, prog)}>
                <PiecePaths p={h} fc={fc} sa={sa} opacity={0.8} />
                <text
                  x={h.w * 0.02 + 1.6}
                  y={h.h * 0.06 + 3.4}
                  fontSize={Math.max(2.6, Math.min(h.w, h.h) / 9)}
                  fill="#232B45"
                  fontFamily="var(--font-sans)"
                  fontWeight={700}
                  stroke="#fff"
                  strokeWidth=".5"
                  style={{ paintOrder: "stroke" }}
                >
                  {LETTERS[hi]} · {h.n}
                </text>
              </g>
            )}

            {/* ligne de couture qui apparaît à la jonction */}
            {geom && (
              <line
                {...geom.seam}
                stroke="var(--primary)"
                strokeWidth=".55"
                strokeDasharray="1.1 0.8"
                strokeLinecap="round"
                opacity={Math.max(0, (prog - 0.82) / 0.18)}
              />
            )}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isFinal ? (
            <span className="font-semibold text-foreground">
              Aperçu final — le style obtenu
            </span>
          ) : (
            <>
              <span className="font-semibold text-foreground">
                Étape {idx + 1} sur {steps.length}
              </span>{" "}
              — pièces : {LETTERS[gi]} {g?.n}
              {h ? ` + ${LETTERS[hi]} ${h.n}` : ""}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {steps.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Étape ${i + 1}`}
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
            aria-label="Aperçu final du vêtement"
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
          ? `Voici ${model.n} assemblé : ${model.desc.toLowerCase()} Tissu conseillé : ${model.fab}.`
          : s[0]}
      </p>

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
          {idx === finalIdx - 1 ? "Aperçu final" : "Suivant"}
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
