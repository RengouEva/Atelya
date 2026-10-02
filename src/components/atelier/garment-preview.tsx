"use client";

import * as React from "react";

import type { Measures, ModelKey } from "@/lib/atelier/patterns";
import { garmentPreview } from "@/lib/atelier/preview";
import { cn } from "@/lib/utils";

/**
 * Aperçu du vêtement fini : silhouette paramétrique dessinée
 * d'après les mesures réelles, à plat, avec ombre au sol.
 */
export function GarmentPreview({
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
  const pad = 6;
  const x0 = -spec.w / 2 - pad;
  const y0 = spec.y0 - pad;
  const vw = spec.w + pad * 2;
  const vh = spec.h - spec.y0 + pad * 2;

  return (
    <svg
      viewBox={`${x0} ${y0} ${vw} ${vh}`}
      className={cn("block", className)}
      role="img"
      aria-label={label ?? "Aperçu du vêtement fini"}
    >
      <ellipse
        cx={0}
        cy={spec.h + 2.4}
        rx={spec.w * 0.3}
        ry={2}
        fill="#000"
        opacity=".09"
      />
      {spec.parts.map((p, i) =>
        p.line ? (
          <path
            key={i}
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
            key={i}
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
