"use client";

import { BadgeCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AssemblyGuide } from "@/components/atelier/assembly-guide";
import { MODELS } from "@/lib/atelier/patterns";
import type { Measures, ModelKey, PieceDef } from "@/lib/atelier/patterns";

/**
 * Étape 03 — la méthode d'assemblage visuelle, étape par étape,
 * jusqu'à l'habit fini. Simple et clair : le guide suffit.
 */
export function StepAssembly({
  modelKey,
  mm,
  defs,
  fc,
  sa,
  variantUrl,
}: {
  modelKey: ModelKey;
  mm: Measures;
  defs: PieceDef[];
  fc: string;
  sa: number;
  variantUrl: string | null;
}) {
  const model = MODELS[modelKey];

  return (
    <section
      aria-label="Méthode d'assemblage"
      className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      {/* Le guide complet : pièces numérotées + pas-à-pas + récapitulatif */}
      <AssemblyGuide modelKey={modelKey} mm={mm} defs={defs} fc={fc} sa={sa} />

      {/* L'habit obtenu */}
      <div className="border-t border-border/60">
        <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:p-5">
          {variantUrl && (
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-background">
              <img
                src={variantUrl}
                alt={`Modèle réalisé : ${model.n}`}
                className="aspect-[3/4] w-full object-cover"
              />
              <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/85 px-2.5 text-[10px] font-semibold text-foreground backdrop-blur">
                <Sparkles className="size-3 text-primary" />
                Modèle visé
              </Badge>
            </div>
          )}
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                <BadgeCheck className="size-[18px]" />
              </div>
              <h2 className="font-display text-lg font-bold leading-tight sm:text-xl">
                L&apos;habit est prêt
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Partez de votre tissu, découpez les pièces numérotées, suivez le
              pas-à-pas ci-dessus dans l&apos;ordre — et votre{" "}
              {model.n.toLowerCase()} est entre vos mains. Une couture à la
              fois, sans rien deviner.
            </p>
            <Badge className="mt-1 w-fit gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-primary">
              Prêt à porter
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
