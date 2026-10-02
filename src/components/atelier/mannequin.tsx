"use client";

import * as React from "react";

import type { Measures, ModelKey } from "@/lib/atelier/patterns";
import { garmentPreview, type PreviewPart } from "@/lib/atelier/preview";
import { cn } from "@/lib/utils";

/**
 * Produit fini porté sur un mannequin de couturier :
 * la silhouette calculée sur mesures est posée sur le buste
 * (encolure, épaules, poitrine, taille, hanches, pied de lampadaire).
 */

interface FormSpec {
  parts: PreviewPart[];
  waistY: number;
  shY: number;
  hipY: number;
  baseY: number;
  halfW: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const TOPS: ModelKey[] = [
  "tshirt",
  "tunique",
  "blouse",
  "robe",
  "blazer",
  "kimono",
  "manche",
];

function buildForm(m: Measures, modelKey: ModelKey, gh: number): FormSpec {
  const ad = m.P / 6 + 8;
  /* La taille du mannequin doit coïncider avec la taille du vêtement */
  const waistY =
    modelKey === "mouchoir"
      ? clamp(m.L, 30, 150) * 0.62
      : TOPS.includes(modelKey)
        ? ad + 7
        : 0;

  const sw2 = m.P * 0.18 + 0.8;
  const bust = m.P / 4 + 1.2;
  const waist = m.T / 4 + 0.6;
  const hip = m.H / 4 + 1.6;
  const shY = waistY - (ad + 7);
  const bustY = waistY - ad * 0.42;
  const hipY = waistY + 16;
  const baseY = Math.max(gh, hipY + 4) + 15;

  const FILL = "var(--secondary)";
  const STROKE = "var(--foreground)";
  const parts: PreviewPart[] = [
    /* pied de lampadaire */
    {
      d: `M-1.1 ${r1(hipY)}h2.2V${r1(baseY)}h-2.2Z`,
      fill: STROKE,
      fo: 0.5,
    },
    {
      d: `M-14.5 ${r1(baseY)}a14.5 3.4 0 1 0 29 0a14.5 3.4 0 1 0 -29 0Z`,
      fill: FILL,
      stroke: STROKE,
      so: 0.45,
      sw: 0.4,
    },
    /* buste */
    {
      d: `M${r1(-3.2)} ${r1(shY)}C${r1(-4.5)} ${r1(shY + 1.2)} ${r1(-sw2)} ${r1(shY + 1.8)} ${r1(-sw2)} ${r1(shY + 3.2)}C${r1(-bust)} ${r1(bustY - 5)} ${r1(-bust)} ${r1(bustY)} ${r1(-waist)} ${r1(waistY)}C${r1(-waist + 0.4)} ${r1(waistY + 5)} ${r1(-hip)} ${r1(hipY - 7)} ${r1(-hip)} ${r1(hipY)}L${r1(hip)} ${r1(hipY)}C${r1(hip)} ${r1(hipY - 7)} ${r1(waist - 0.4)} ${r1(waistY + 5)} ${r1(waist)} ${r1(waistY)}C${r1(bust)} ${r1(bustY)} ${r1(bust)} ${r1(bustY - 5)} ${r1(sw2)} ${r1(shY + 3.2)}C${r1(sw2)} ${r1(shY + 1.8)} ${r1(4.5)} ${r1(shY + 1.2)} ${r1(3.2)} ${r1(shY)}Z`,
      fill: FILL,
      stroke: STROKE,
      so: 0.45,
      sw: 0.4,
    },
    /* cou + pommeau */
    {
      d: `M-2.7 ${r1(shY - 8)}h5.4v9h-5.4Z`,
      fill: FILL,
      stroke: STROKE,
      so: 0.45,
      sw: 0.4,
    },
    {
      d: `M0 ${r1(shY - 11.2)}a2.5 2.5 0 1 0 0.01 0Z`,
      fill: FILL,
      stroke: STROKE,
      so: 0.45,
      sw: 0.4,
    },
    /* trait de taille du mannequin */
    {
      d: `M${r1(-waist + 0.6)} ${r1(waistY)}H${r1(waist - 0.6)}`,
      line: true,
      stroke: STROKE,
      so: 0.3,
      sw: 0.35,
      dash: "1.2 0.8",
    },
  ];

  return {
    parts,
    waistY,
    shY,
    hipY,
    baseY,
    halfW: Math.max(hip + 3, sw2 + 4, 16),
  };
}

export function MannequinView({
  m,
  modelKey,
  fc,
  className,
  label,
}: {
  m: Measures;
  modelKey: ModelKey;
  fc: string;
  className?: string;
  label?: string;
}) {
  const spec = React.useMemo(
    () => garmentPreview(m, modelKey, fc),
    [m, modelKey, fc]
  );
  const form = React.useMemo(() => buildForm(m, modelKey, spec.h), [m, modelKey, spec.h]);

  const minX = -Math.max(spec.w / 2, form.halfW) - 5;
  const maxX = Math.max(spec.w / 2, form.halfW) + 5;
  const minY = Math.min(form.shY - 15, spec.y0 - 5);
  const maxY = form.baseY + 6;
  const pad = 4;

  return (
    <svg
      viewBox={`${r1(minX - pad)} ${r1(minY - pad)} ${r1(maxX - minX + pad * 2)} ${r1(maxY - minY + pad * 2)}`}
      className={cn("block", className)}
      role="img"
      aria-label={label ?? "Vêtement fini porté sur mannequin"}
    >
      {form.parts.map((p, i) =>
        p.line ? (
          <path
            key={`f${i}`}
            d={p.d}
            fill="none"
            stroke={p.stroke}
            strokeOpacity={p.so}
            strokeWidth={p.sw}
            strokeDasharray={p.dash}
            strokeLinecap="round"
          />
        ) : (
          <path
            key={`f${i}`}
            d={p.d}
            fill={p.fill}
            fillOpacity={p.fo ?? 1}
            stroke={p.stroke}
            strokeOpacity={p.so}
            strokeWidth={p.sw}
            strokeLinejoin="round"
          />
        )
      )}
      {spec.parts.map((p, i) =>
        p.line ? (
          <path
            key={`g${i}`}
            d={p.d}
            fill="none"
            stroke={p.stroke}
            strokeOpacity={p.so}
            strokeWidth={p.sw}
            strokeDasharray={p.dash}
            strokeLinecap={p.cap ?? "butt"}
          />
        ) : (
          <path
            key={`g${i}`}
            d={p.d}
            fill={p.fill}
            fillOpacity={p.fo ?? 1}
            stroke={p.stroke}
            strokeOpacity={p.so}
            strokeWidth={p.sw}
            strokeLinejoin="round"
          />
        )
      )}
    </svg>
  );
}
