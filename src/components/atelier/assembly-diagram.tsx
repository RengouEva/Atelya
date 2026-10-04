"use client";

import * as React from "react";
import { PiecePaths } from "@/components/atelier/pieces";
import type { Join, PieceDef } from "@/lib/atelier/patterns";
import { cn } from "@/lib/utils";

/**
 * Schéma technique d'assemblage, façon cours de patronage : chaque étape est
 * dessinée à l'échelle — l'ancre reste en place, la pièce à assembler arrive
 * dans sa position de montage (écartée), avec les épingles, la ligne de
 * couture à la bonne valeur et la flèche de montage. Les étapes de
 * préparation reçoivent un glyphe technique (pince, ourlet, fermeture,
 * fronce, plis, biais). Entièrement dynamique : utilise les vraies pièces
 * du patronage du modèle choisi.
 */

/* Palette du schéma */
const PIN = "#C99A2C"; // épingles dorées
const STITCH = "#be185d"; // ligne de couture (fil contrasté)
const INK = "#1e293b"; // traits techniques

const r1 = (n: number) => Math.round(n * 10) / 10;
const GAP = 3; // écart entre les pièces (vue éclatée)

/* Placement de la pièce à joindre (l'ancre reste à l'origine) */
function placeJoin(
  join: Join,
  w1: number,
  h1: number,
  w2: number,
  h2: number,
): { tx: number; ty: number; sx: 1 | -1; sy: 1 | -1 } {
  switch (join) {
    case "ll":
      return { tx: -GAP, ty: 0, sx: -1, sy: 1 };
    case "rr":
      return { tx: w1 + GAP + w2, ty: 0, sx: -1, sy: 1 };
    case "rl":
      return { tx: w1 + GAP, ty: 0, sx: 1, sy: 1 };
    case "tt":
      return { tx: 0, ty: -GAP, sx: 1, sy: -1 };
    case "tc":
      return { tx: (w1 - w2) / 2, ty: -GAP, sx: 1, sy: -1 };
    case "bt":
      return { tx: 0, ty: h1 + GAP, sx: 1, sy: 1 };
    case "ct":
    default:
      return { tx: (w1 - w2) / 2, ty: h1 * 0.42, sx: 1, sy: 1 };
  }
}

/* Zone de couture : segment le long du bord de jonction de l'ancre */
function seamEdge(
  join: Join,
  w1: number,
  h1: number,
  w2: number,
  h2: number,
): { axis: "v" | "h"; at: number; from: number; len: number } | null {
  const ol = Math.min(h1, h2);
  const ow = Math.min(w1, w2);
  switch (join) {
    case "ll":
      return { axis: "v", at: 0, from: 0, len: ol };
    case "rr":
    case "rl":
      return { axis: "v", at: w1, from: 0, len: ol };
    case "tt":
    case "tc":
      return { axis: "h", at: 0, from: 0, len: ow };
    case "bt":
      return { axis: "h", at: h1, from: 0, len: ow };
    default:
      return null; // ct (ceinture nouée) : pas de couture dessinée
  }
}

/* Épingle : trait doré avec tête, en travers du bord de jonction */
function Pin({ x, y, axis }: { x: number; y: number; axis: "v" | "h" }) {
  const L = 2.4;
  if (axis === "v")
    return (
      <g transform={`translate(${r1(x)} ${r1(y)})`}>
        <line x1={-L} y1={0} x2={L * 0.55} y2={0} stroke={PIN} strokeWidth=".5" strokeLinecap="round" />
        <circle cx={L * 0.85} cy={0} r=".72" fill={PIN} />
      </g>
    );
  return (
    <g transform={`translate(${r1(x)} ${r1(y)})`}>
      <line x1={0} y1={-L} x2={0} y2={L * 0.55} stroke={PIN} strokeWidth=".5" strokeLinecap="round" />
      <circle cx={0} cy={L * 0.85} r=".72" fill={PIN} />
    </g>
  );
}

/* Étiquette blanche posée sur la couture (Côtés, Taille, Épaules…) */
function SeamPill({ x, y, label }: { x: number; y: number; label: string }) {
  const w = label.length * 2.15 + 4;
  return (
    <g transform={`translate(${r1(x)} ${r1(y)})`} opacity=".97">
      <rect x={-w / 2} y={-2.3} width={w} height={4.6} rx={2.3} fill="#ffffff" stroke="#94a3b8" strokeWidth={".3"} />
      <text
        y="1.1"
        fontSize="3"
        textAnchor="middle"
        fill="#0f172a"
        fontFamily="var(--font-sans)"
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}

/* Pastille numérotée d'une pièce, à l'échelle du schéma */
function Tag({
  x,
  y,
  n,
  r,
}: {
  x: number;
  y: number;
  n: number;
  r: number;
}) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)})`}>
      <circle r={r} cy={r * 0.16} fill="#0c1533" opacity=".16" />
      <circle r={r} fill="#ffffff" stroke="#A9B7D8" strokeWidth=".26" />
      <text
        y={r * 0.38}
        fontSize={r * 1.05}
        textAnchor="middle"
        fill="#16224B"
        fontFamily="var(--font-sans)"
        fontWeight={800}
      >
        {n}
      </text>
    </g>
  );
}

/* Trait technique avec halo blanc (visible sur tout tissu) */
function Tech({ d, dash }: { d: string; dash?: string }) {
  return (
    <>
      <path d={d} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={dash} />
      <path
        d={d}
        fill="none"
        stroke={INK}
        strokeWidth=".55"
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </>
  );
}

/* Glyphes de préparation sur une pièce seule */
function PrepGlyph({
  kind,
  w,
  h,
  milieu,
}: {
  kind: "pince" | "plis" | "ourlet" | "fermeture" | "fronce" | "biais";
  w: number;
  h: number;
  milieu?: boolean;
}) {
  if (kind === "pince") {
    const cx = w * 0.42;
    const half = Math.max(2.2, w * 0.09);
    const depth = Math.min(h * 0.38, 16);
    return (
      <g>
        <Tech d={`M${r1(cx - half)} 1 L${r1(cx)} ${r1(depth)}`} />
        <Tech d={`M${r1(cx + half)} 1 L${r1(cx)} ${r1(depth)}`} />
        <Tech d={`M${r1(cx)} 1 L${r1(cx)} ${r1(depth)}`} dash="1.2 .9" />
        <Pin x={cx} y={1.6} axis="h" />
      </g>
    );
  }
  if (kind === "ourlet") {
    const yf = h - Math.min(6, h * 0.1);
    return (
      <g>
        <Tech d={`M2 ${r1(yf)} L${r1(w - 2)} ${r1(yf)}`} dash="1.4 1" />
        <Tech d={`M${r1(w * 0.62)} ${r1(h - 1.2)} L${r1(w * 0.62)} ${r1(yf + 1.6)}`} />
        <Tech d={`M${r1(w * 0.62 - 1)} ${r1(yf + 3)} L${r1(w * 0.62)} ${r1(yf + 1.6)} L${r1(w * 0.62 + 1)} ${r1(yf + 3)}`} />
      </g>
    );
  }
  if (kind === "fermeture") {
    const xz = milieu ? 1.6 : w - 1.6;
    return (
      <g>
        <Tech d={`M${r1(xz)} 1.5 L${r1(xz)} ${r1(h * 0.52)}`} dash="1.3 .9" />
        <rect
          x={r1(xz - 1)}
          y={r1(h * 0.52 + 1)}
          width="2"
          height="3.2"
          rx=".5"
          fill={PIN}
          stroke={INK}
          strokeWidth=".3"
        />
      </g>
    );
  }
  if (kind === "plis") {
    return (
      <g>
        <Tech d={`M${r1(w * 0.4)} 1.5 L${r1(w * 0.4)} ${r1(h - 1.5)}`} dash="1.6 1.1" />
        <Tech d={`M${r1(w * 0.6)} 1.5 L${r1(w * 0.6)} ${r1(h - 1.5)}`} dash="1.6 1.1" />
        <Tech d={`M${r1(w * 0.4 - 1)} 3.4 L${r1(w * 0.4)} 1.6 L${r1(w * 0.4 + 1)} 3.4`} />
        <Tech d={`M${r1(w * 0.6 - 1)} 3.4 L${r1(w * 0.6)} 1.6 L${r1(w * 0.6 + 1)} 3.4`} />
      </g>
    );
  }
  if (kind === "fronce") {
    return (
      <g>
        <Tech d={`M1.5 1.4 L${r1(w - 1.5)} 1.4`} dash="1 0.8" />
        <Tech d={`M1.5 3 L${r1(w - 1.5)} 3`} dash="1 0.8" />
        <Pin x={w * 0.3} y={2.2} axis="h" />
        <Pin x={w * 0.7} y={2.2} axis="h" />
      </g>
    );
  }
  /* biais : ligne courbe le long de l'encolure */
  return (
    <g>
      <Tech d={`M2 2.6 Q ${r1(w / 2)} 6 ${r1(w - 2)} 2.6`} dash="1.4 1" />
      <Pin x={w * 0.5} y={4.4} axis="v" />
    </g>
  );
}

export type PrepKind = "pince" | "plis" | "ourlet" | "fermeture" | "fronce" | "biais";

export function AssemblyDiagram({
  anchor,
  mover,
  join,
  fc,
  sa,
  numA,
  numB,
  seamLabel,
  prep,
  milieu,
  className,
}: {
  anchor: PieceDef;
  mover: PieceDef | null;
  join: Join | null;
  fc: string;
  sa: number;
  numA: number;
  numB: number;
  seamLabel?: string;
  prep?: PrepKind | null;
  milieu?: boolean;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  const w1 = anchor.w;
  const h1 = anchor.h;

  /* Extents des deux pièces + zone de couture + flèche de montage */
  let minX = 0;
  let minY = 0;
  let maxX = w1;
  let maxY = h1;
  let p: { tx: number; ty: number; sx: 1 | -1; sy: 1 | -1 } | null = null;
  let se: { axis: "v" | "h"; at: number; from: number; len: number } | null = null;
  let arrow: string | null = null;
  if (mover && join) {
    p = placeJoin(join, w1, h1, mover.w, mover.h);
    se = seamEdge(join, w1, h1, mover.w, mover.h);
    const x0 = Math.min(p.tx, p.tx + p.sx * mover.w);
    const x1m = Math.max(p.tx, p.tx + p.sx * mover.w);
    const y0 = Math.min(p.ty, p.ty + p.sy * mover.h);
    const y1m = Math.max(p.ty, p.ty + p.sy * mover.h);
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1m);
    maxY = Math.max(maxY, y1m);
    if (join !== "ct") {
      const mcx = p.tx + (p.sx * mover.w) / 2;
      const mcy = p.ty + (p.sy * mover.h) / 2;
      let ex: number;
      let ey: number;
      if (se && se.axis === "v") {
        ex = se.at === 0 ? w1 * 0.3 : w1 * 0.7;
        ey = se.from + se.len / 2;
      } else if (se) {
        ex = se.from + se.len / 2;
        ey = h1 * 0.22;
      } else {
        ex = w1 / 2;
        ey = h1 * 0.22;
      }
      const mx = (mcx + ex) / 2 + (se && se.axis === "v" ? 0 : 10);
      const my = (mcy + ey) / 2 - (se && se.axis === "v" ? 10 : 0);
      arrow = `M${r1(mcx)} ${r1(mcy)} Q ${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
    }
  }
  const PAD = 7;
  const vx = minX - PAD;
  const vy = minY - PAD;
  const vw = maxX - minX + PAD * 2;
  const vh = maxY - minY + PAD * 2;

  const tagR = Math.max(2.4, Math.min(4.6, Math.min(w1, h1) / 9));

  return (
    <svg
      viewBox={`${r1(vx)} ${r1(vy)} ${r1(vw)} ${r1(vh)}`}
      className={cn("block", className)}
      role="img"
      aria-label={`Schéma d'assemblage : ${anchor.n}${mover ? ` + ${mover.n}` : ""}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id={`${uid}-ah`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--primary)" />
        </marker>
      </defs>

      {/* L'ancre reste en place */}
      <g transform="translate(0 0)">
        <PiecePaths p={anchor} fc={fc} sa={sa} />
      </g>

      {/* La pièce qui arrive en position de montage */}
      {mover && p && (
        <g transform={`translate(${r1(p.tx)} ${r1(p.ty)}) scale(${p.sx} ${p.sy})`} opacity=".96">
          <PiecePaths p={mover} fc={fc} sa={sa} />
        </g>
      )}

      {/* Valeur de couture : ligne pointillée à l'intérieur de chaque bord */}
      {se && sa > 0 && (
        <g stroke={STITCH} strokeWidth=".42" strokeDasharray="1.1 .8" strokeLinecap="round" fill="none">
          {se.axis === "v" ? (
            <>
              <line x1={r1(se.at === 0 ? sa : w1 - sa)} y1={r1(se.from + 2)} x2={r1(se.at === 0 ? sa : w1 - sa)} y2={r1(se.from + se.len - 2)} />
              <line
                x1={r1(se.at === 0 ? -GAP - sa : w1 + GAP + sa)}
                y1={r1(se.from + 2)}
                x2={r1(se.at === 0 ? -GAP - sa : w1 + GAP + sa)}
                y2={r1(se.from + se.len - 2)}
              />
            </>
          ) : (
            <>
              <line x1={r1(se.from + 2)} y1={r1(se.at === 0 ? sa : h1 - sa)} x2={r1(se.from + se.len - 2)} y2={r1(se.at === 0 ? sa : h1 - sa)} />
              <line
                x1={r1(se.from + 2)}
                y1={r1(se.at === 0 ? -GAP - sa : h1 + GAP + sa)}
                x2={r1(se.from + se.len - 2)}
                y2={r1(se.at === 0 ? -GAP - sa : h1 + GAP + sa)}
              />
            </>
          )}
        </g>
      )}

      {/* Épingles en travers de la couture */}
      {se &&
        [0.24, 0.5, 0.76].map((t) => (
          <Pin
            key={t}
            x={se.axis === "v" ? se.at : se.from + se.len * t}
            y={se.axis === "v" ? se.from + se.len * t : se.at}
            axis={se.axis}
          />
        ))}

      {/* Flèche de montage */}
      {arrow && (
        <path
          d={arrow}
          fill="none"
          stroke="var(--primary)"
          strokeWidth=".8"
          strokeLinecap="round"
          markerEnd={`url(#${uid}-ah)`}
          opacity=".9"
        />
      )}

      {/* Étiquette de la couture */}
      {se && seamLabel && (
        <SeamPill
          x={se.axis === "v" ? se.at : se.from + se.len / 2}
          y={se.axis === "v" ? se.from + se.len / 2 : se.at}
          label={seamLabel}
        />
      )}

      {/* Numéros des pièces */}
      <Tag x={w1 / 2} y={h1 / 2} n={numA} r={tagR} />
      {mover && p && (
        <Tag x={p.tx + (p.sx * mover.w) / 2} y={p.ty + (p.sy * mover.h) / 2} n={numB} r={tagR} />
      )}

      {/* Glyphe de préparation (étape sans jonction) */}
      {!mover && prep && <PrepGlyph kind={prep} w={w1} h={h1} milieu={milieu} />}
    </svg>
  );
}
