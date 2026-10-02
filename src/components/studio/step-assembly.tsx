"use client";

import * as React from "react";
import { GitMerge } from "lucide-react";

import { AssemblyPlayer } from "@/components/atelier/assembly-player";
import type { Measures, ModelKey, PieceDef } from "@/lib/atelier/patterns";

/**
 * Étape 04 — l'assemblage pas à pas : les pièces se rejoignent couture
 * par couture, jusqu'au vêtement fini porté sur mannequin.
 */
export function StepAssembly({
  modelKey,
  mm,
  defs,
  fc,
  sa,
}: {
  modelKey: ModelKey;
  mm: Measures;
  defs: PieceDef[];
  fc: string;
  sa: number;
}) {
  const [step, setStep] = React.useState(0);

  return (
    <section
      aria-label="Assemblage pas à pas"
      className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <GitMerge className="size-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Montage pas à pas
          </h2>
          <p className="text-xs text-muted-foreground">
            Coutures numérotées, bord à bord — jusqu&apos;au produit fini porté
            sur mannequin
          </p>
        </div>
      </header>
      <div className="p-5">
        <AssemblyPlayer
          modelKey={modelKey}
          m={mm}
          defs={defs}
          fc={fc}
          sa={sa}
          step={step}
          onStep={setStep}
          resetKey={`${modelKey}|${mm.P}|${mm.T}|${mm.H}|${mm.L}`}
        />
      </div>
    </section>
  );
}
