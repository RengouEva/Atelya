"use client";

import * as React from "react";
import { ArrowRight, Ruler, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumPiece } from "@/components/atelier/assembly-guide";
import { FabricTable } from "@/components/atelier/fabric-table";
import { ModelIcon } from "@/components/atelier/pieces";
import { MODELS, buildLayout, meterage, LETTERS } from "@/lib/atelier/patterns";
import type { Measures, ModelKey } from "@/lib/atelier/patterns";
import type { StudioMeasures } from "@/lib/studio/config";

/**
 * Étape 02 — le patronage : les pièces calculées sur les mesures,
 * leur plan de placement sur le tissu et le métrage. Simple, visuel,
 * sans simulation — le guide d'assemblage prend ensuite le relais.
 */
export function StepPatronage({
  modelKey,
  mm,
  measures,
  onContinue,
}: {
  modelKey: ModelKey;
  mm: Measures;
  measures: StudioMeasures;
  onContinue: () => void;
}) {
  const model = MODELS[modelKey];
  const sa = measures.S || 0;
  const fw = measures.W || 140;

  const defs = React.useMemo(() => model.g(mm), [model, mm]);
  const layout = React.useMemo(() => buildLayout(defs, sa, fw), [defs, sa, fw]);
  const meters = meterage(layout);
  const tooNarrow = layout.mx > layout.raw;

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
          <ModelIcon kind={modelKey} className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold leading-tight">
            Le patronage — vos pièces
          </h2>
          <p className="text-xs text-muted-foreground">
            {model.n} · {layout.pieces.length} pièces à découper ({defs.length}{" "}
            numérotées) · {meters} m en {fw} cm de laize
          </p>
        </div>
      </div>

      {/* Les pièces + le placement */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section
          aria-label="Les pièces du patron"
          className="card-luxe rounded-2xl border border-border/70 bg-card"
        >
          <header className="border-b border-border/60 px-5 py-4">
            <h3 className="font-display text-[17px] font-bold">
              Les pièces à découper
            </h3>
            <p className="text-xs text-muted-foreground">
              Numérotées, avec leurs dimensions réelles
            </p>
          </header>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {defs.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-background p-3"
              >
                <NumPiece def={p} num={i + 1} fc={measures.C} sa={sa} />
                <p className="mt-2 truncate text-sm font-semibold">
                  {i + 1} – {p.n}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {LETTERS[i]} · {Math.round(p.w)} × {Math.round(p.h)} cm · ×
                  {p.q}
                  {p.fold ? " · au pli" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Plan de placement sur le tissu"
          className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
        >
          <header className="flex flex-wrap items-center gap-2.5 border-b border-border/60 px-5 py-4">
            <h3 className="flex items-center gap-2 font-display text-[17px] font-bold">
              <Ruler className="size-4 text-primary" />
              Placement sur le tissu
            </h3>
            <Badge
              variant="outline"
              className="ml-auto gap-1.5 rounded-full border-primary/40 bg-primary/10 font-normal text-primary"
            >
              {meters} m
            </Badge>
          </header>
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            {tooNarrow && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>
                  Le tissu est trop étroit : il faut au moins{" "}
                  <b>{Math.ceil(layout.mx)} cm</b> de laize.
                </span>
              </div>
            )}
            <FabricTable
              layout={layout}
              fc={measures.C}
              sa={sa}
              cut={new Set()}
              cuttingId={null}
              onCut={() => {}}
              zoom={1}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Disposez vos pièces ainsi sur le tissu plié, puis coupez
              d&apos;après les contours — la numérotation sert au guide
              d&apos;assemblage.
            </p>
          </div>
        </section>
      </div>

      {/* CTA unique */}
      <Button
        onClick={onContinue}
        size="lg"
        className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-13 w-full rounded-full text-[15px] font-bold shadow-lg"
      >
        Voir la méthode d&apos;assemblage
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
