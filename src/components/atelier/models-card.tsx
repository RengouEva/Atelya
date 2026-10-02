"use client";

import * as React from "react";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS, type ModelKey } from "@/lib/atelier/patterns";
import { ModelIcon } from "@/components/atelier/pieces";

export function ModelsCard({
  value,
  onChange,
}: {
  value: ModelKey;
  onChange: (k: ModelKey) => void;
}) {
  const entries = Object.entries(MODELS) as [
    ModelKey,
    (typeof MODELS)[ModelKey],
  ][];

  return (
    <section
      aria-label="Choix du modèle"
      className="card-luxe rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <Shirt className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Modèles
          </h2>
          <p className="text-xs text-muted-foreground">
            {entries.length} patrons de base
          </p>
        </div>
      </header>

      <div className="chips-scroll flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {entries.map(([k, m]) => {
          const on = k === value;
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              aria-pressed={on}
              className={cn(
                "group flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 lg:w-full",
                on
                  ? "border-primary/60 bg-accent shadow-sm"
                  : "border-border/70 bg-background hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground group-hover:text-foreground"
                )}
              >
                <ModelIcon kind={k} className="size-[18px]" />
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-nowrap text-sm lg:whitespace-normal",
                  on ? "font-semibold" : "font-medium"
                )}
              >
                {m.n}
              </span>
              <span className="hidden shrink-0 text-[11px] tabular-nums text-muted-foreground lg:block">
                L {m.L} cm
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
