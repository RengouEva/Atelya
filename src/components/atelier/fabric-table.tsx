"use client";

import * as React from "react";
import type { BuiltLayout } from "@/lib/atelier/patterns";

const PAD = 9;

/**
 * Plan de coupe interactif : le tissu posé sur la table,
 * les pièces se découpent d’un toucher avec une trace animée.
 */
export function FabricTable({
  layout,
  fc,
  sa,
  cut,
  cuttingId,
  onCut,
  zoom,
}: {
  layout: BuiltLayout;
  fc: string;
  sa: number;
  cut: Set<number>;
  cuttingId: number | null;
  onCut: (id: number) => void;
  zoom: number;
}) {
  const { pieces, Wf, H } = layout;
  const fs = Math.max(2.2, Wf / 45);

  const ticksX = React.useMemo(() => {
    const t: number[] = [];
    for (let x = 0; x <= Wf; x += 10) t.push(x);
    return t;
  }, [Wf]);
  const ticksY = React.useMemo(() => {
    const t: number[] = [];
    for (let y = 0; y <= H; y += 10) t.push(y);
    return t;
  }, [H]);

  return (
    <div
      className="table-wrap relative overflow-auto rounded-xl border border-border/60 bg-[var(--table)] shadow-inner"
      style={{ maxHeight: "78vh" }}
    >
      <svg
        viewBox={`${-PAD} ${-PAD} ${Wf + PAD * 2} ${H + PAD * 2}`}
        style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 100}%` }}
        className="block"
        role="group"
        aria-label="Plan de coupe sur le tissu"
      >
        <defs>
          <pattern
            id="weave"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="5"
              stroke="#ffffff"
              strokeOpacity=".07"
              strokeWidth="1.4"
            />
            <line
              x1="2.5"
              y1="0"
              x2="2.5"
              y2="5"
              stroke="#000000"
              strokeOpacity=".04"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Table de coupe */}
        <rect
          x={-PAD + 1}
          y={-PAD + 1}
          width={Wf + PAD * 2 - 2}
          height={H + PAD * 2 - 2}
          rx="2.5"
          fill="var(--table)"
        />

        {/* Règle graduée haute */}
        {ticksX.map((x) => (
          <g key={`x${x}`}>
            <line
              x1={x}
              y1={-PAD + 1}
              x2={x}
              y2={-PAD + 1 + (x % 50 === 0 ? 3.6 : 1.9)}
              stroke="var(--foreground)"
              strokeOpacity={x % 50 === 0 ? 0.45 : 0.26}
              strokeWidth=".26"
            />
            {x % 50 === 0 && x > 0 && (
              <text
                x={x}
                y={-PAD + 6.6}
                fontSize="2.7"
                textAnchor="middle"
                fill="var(--foreground)"
                fillOpacity=".52"
                fontFamily="var(--font-sans)"
              >
                {x}
              </text>
            )}
          </g>
        ))}
        {/* Règle graduée gauche */}
        {ticksY.map((y) => (
          <g key={`y${y}`}>
            <line
              x1={-PAD + 1}
              y1={y}
              x2={-PAD + 1 + (y % 50 === 0 ? 3.6 : 1.9)}
              y2={y}
              stroke="var(--foreground)"
              strokeOpacity={y % 50 === 0 ? 0.45 : 0.26}
              strokeWidth=".26"
            />
            {y % 50 === 0 && y > 0 && (
              <text
                x={-PAD + 6.8}
                y={y + 0.9}
                fontSize="2.7"
                textAnchor="middle"
                fill="var(--foreground)"
                fillOpacity=".52"
                fontFamily="var(--font-sans)"
              >
                {y}
              </text>
            )}
          </g>
        ))}

        {/* Tissu + texture weave */}
        <rect width={Wf} height={H} fill={fc} />
        <rect width={Wf} height={H} fill="url(#weave)" />

        {/* Lisières */}
        <line
          x1=".8"
          y1="0"
          x2=".8"
          y2={H}
          stroke="#fff"
          strokeOpacity=".55"
          strokeWidth=".3"
          strokeDasharray="2 1.2"
        />
        <line
          x1={Wf - 0.8}
          y1="0"
          x2={Wf - 0.8}
          y2={H}
          stroke="#fff"
          strokeOpacity=".55"
          strokeWidth=".3"
          strokeDasharray="2 1.2"
        />

        {/* Pièces */}
        {pieces.map((p) => {
          const isCut = cut.has(p.id);
          const fr = p.eo ? "evenodd" : undefined;
          const tx = p.w / 2;
          const ty = p.h / 2;
          return (
            <g
              key={p.id}
              transform={`translate(${p.x} ${p.y})`}
              className={isCut ? undefined : "pc"}
              onClick={isCut ? undefined : () => onCut(p.id)}
              onKeyDown={
                isCut
                  ? undefined
                  : (e) => {
                      if (e.key === "Enter" || e.key === " ") onCut(p.id);
                    }
              }
              role={isCut ? undefined : "button"}
              tabIndex={isCut ? undefined : 0}
              aria-label={isCut ? undefined : `Couper ${p.name}`}
            >
              {isCut ? (
                <>
                  <path
                    d={p.d}
                    fillRule={fr}
                    fill="var(--table)"
                    stroke="var(--table)"
                    strokeWidth={2 * sa}
                    strokeLinejoin="round"
                  />
                  <path
                    d={p.d}
                    fillRule={fr}
                    fill="none"
                    stroke="#fff"
                    strokeOpacity=".6"
                    strokeWidth=".35"
                    strokeDasharray="1.5 1"
                  />
                </>
              ) : (
                <>
                  {/* marge de couture (guide de coupe) */}
                  <path
                    d={p.d}
                    fillRule={fr}
                    fill="#000"
                    fillOpacity=".1"
                    stroke="#000"
                    strokeOpacity=".42"
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
                  />
                  {/* papier patron */}
                  <path
                    className="pp"
                    d={p.d}
                    fillRule={fr}
                    fill="#fff"
                    fillOpacity=".84"
                    stroke="#232B45"
                    strokeOpacity=".5"
                    strokeWidth=".3"
                  />
                  {/* ligne de couture */}
                  <path
                    d={p.d}
                    fillRule={fr}
                    fill="none"
                    stroke="#fff"
                    strokeWidth=".4"
                    strokeDasharray="1.5 1"
                  />
                  {/* trace de découpe animée */}
                  {cuttingId === p.id && (
                    <path
                      className="cut-trace"
                      d={p.d}
                      fillRule={fr}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={2 * sa + 0.4}
                      strokeLinejoin="round"
                      pathLength={1}
                    />
                  )}
                  {/* droit-fil */}
                  <path
                    d={`M${tx} ${ty + p.h * 0.2}V${ty - p.h * 0.2}`}
                    stroke="#232B45"
                    strokeWidth=".35"
                    opacity=".5"
                  />
                  <path
                    d={`M${tx - 0.9} ${ty - p.h * 0.2 + 1.4}L${tx} ${ty - p.h * 0.2}L${tx + 0.9} ${ty - p.h * 0.2 + 1.4}`}
                    fill="none"
                    stroke="#232B45"
                    strokeWidth=".35"
                    opacity=".5"
                  />
                  {/* nom */}
                  <text
                    x={tx}
                    y={ty + p.h * 0.28}
                    fontSize={fs}
                    textAnchor="middle"
                    fill="#232B45"
                    fontFamily="var(--font-sans)"
                  >
                    {p.name}
                  </text>
                  {p.fold && (
                    <text
                      x="1"
                      y={ty}
                      fontSize={fs * 0.72}
                      fill="var(--primary)"
                      fontFamily="var(--font-sans)"
                      fontWeight={600}
                    >
                      pli
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
