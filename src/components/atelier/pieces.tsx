"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PieceDef } from "@/lib/atelier/patterns";

/* ------------------------------------------------------------------ */
/* Rendu d’une pièce de patron (marge de couture + papier + couture)   */
/* ------------------------------------------------------------------ */

export function PiecePaths({
  p,
  fc,
  sa,
  opacity = 1,
  seam = true,
}: {
  p: PieceDef;
  fc: string;
  sa: number;
  opacity?: number;
  seam?: boolean;
}) {
  const fr = p.eo ? "evenodd" : undefined;
  return (
    <>
      <path
        d={p.d}
        fillRule={fr}
        fill="#000"
        fillOpacity=".1"
        stroke="#000"
        strokeOpacity=".4"
        strokeWidth={2 * sa + 0.4}
        strokeLinejoin="round"
      />
      <path
        d={p.d}
        fillRule={fr}
        fill={fc}
        stroke={fc}
        strokeWidth={2 * sa}
        strokeLinejoin="round"
        opacity={opacity}
      />
      {seam && (
        <path
          d={p.d}
          fillRule={fr}
          fill="none"
          stroke="#fff"
          strokeWidth=".4"
          strokeDasharray="1.5 1"
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Miniature d’une pièce (galerie, panier)                             */
/* ------------------------------------------------------------------ */

export function PieceMini({
  p,
  fc,
  sa,
  letter,
  className,
}: {
  p: PieceDef;
  fc: string;
  sa: number;
  letter?: string;
  className?: string;
}) {
  const fs = Math.max(3, Math.min(p.w, p.h) / 4);
  return (
    <svg
      viewBox={`${-sa - 1} ${-sa - 1} ${p.w + 2 * sa + 2} ${p.h + 2 * sa + 2}`}
      className={cn("block h-28 w-full", className)}
      role="img"
      aria-label={p.n}
    >
      <PiecePaths p={p} fc={fc} sa={sa} />
      {letter && (
        <text
          x={p.w / 2}
          y={p.h / 2 + fs / 3}
          fontSize={fs}
          textAnchor="middle"
          fill="#fff"
          stroke="#232B45"
          strokeWidth=".4"
          style={{ paintOrder: "stroke" }}
          fontFamily="var(--font-sans)"
          fontWeight={600}
        >
          {letter}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Icônes de modèles (silhouettes dessinées)                           */
/* ------------------------------------------------------------------ */

export function ModelIcon({
  kind,
  className,
}: {
  kind: string;
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    droite: (
      <>
        <path d="M8 3.5h8l2.4 17H5.6z" />
        <path d="M8 3.5h8" strokeWidth={2.4} />
      </>
    ),
    cercle: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="2.6" />
      </>
    ),
    mouchoir: (
      <>
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />
        <circle cx="12" cy="12" r="2.1" />
      </>
    ),
    short: (
      <>
        <path d="M5.5 4h13L20 10l-2 9.5h-4.4L12 12l-1.6 7.5H6L4 10z" />
        <path d="M5.5 4h13" strokeWidth={2.2} />
      </>
    ),
    tunique: (
      <>
        <path d="M9 3.5h6l1 4 3.2 13H5L8 7.5z" />
        <path d="M9 3.5 12 8l3-4.5" />
      </>
    ),
    blazer: (
      <>
        <path d="M8 3.5h8V7l3 3.5-1.6 10h-4L12 15l-1.4 5.5h-4L5 10.5 8 7z" />
        <path d="M9.6 3.5 12 8.2l2.4-4.7" />
      </>
    ),
    manche: (
      <path d="M7.5 3.5c2.5 2 6.5 2 9 0L20 17c-3.5 2.6-12.5 2.6-16 0z" />
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      {paths[kind] ?? paths.droite}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Anneau de progression                                               */
/* ------------------------------------------------------------------ */

export function ProgressRing({
  value,
  total,
  size = 46,
  stroke = 5,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
        {value}/{total}
      </span>
    </div>
  );
}
