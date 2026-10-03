"use client";

import { Hand } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SewingStudio } from "@/components/atelier/sewing-studio";
import type { Measures, ModelKey, PieceDef } from "@/lib/atelier/patterns";

/**
 * Étape 04 — atelier de couture interactif : l'utilisateur assemble les
 * pièces en sous-ensembles (A, B…), couse chaque zone guidée au doigt ou
 * à la pédale, jusqu'au vêtement fini porté sur mannequin.
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
  return (
    <section
      aria-label="Atelier de couture guidé"
      className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      {/* Bandeau photo — le geste 5 de la méthode : coudre */}
      <div className="relative h-36 w-full overflow-hidden sm:h-44" aria-hidden="true">
        <img
          src="/ai/j-coudre.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070d24]/90 via-[#070d24]/55 to-[#070d24]/10" />
        <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-5">
          <Badge className="w-fit gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold text-foreground backdrop-blur">
            <Hand className="size-3 text-primary" />
            Geste 5/5
          </Badge>
          <p className="max-w-[300px] font-display text-[15px] font-bold leading-snug text-white drop-shadow sm:text-base">
            Les petites pièces réunies, il ne reste qu&apos;à coudre — une
            couture à la fois.
          </p>
        </div>
      </div>

      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <Hand className="size-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Atelier de couture — à vous de coudre
          </h2>
          <p className="text-xs text-muted-foreground">
            Assemblez les pièces en sous-ensembles A, B… puis cousez chaque
            zone guidée, jusqu&apos;au vêtement fini
          </p>
        </div>
      </header>
      <div className="p-5">
        <SewingStudio
          modelKey={modelKey}
          m={mm}
          defs={defs}
          fc={fc}
          sa={sa}
          resetKey={`${modelKey}|${mm.P}|${mm.T}|${mm.H}|${mm.L}`}
        />
      </div>
    </section>
  );
}
