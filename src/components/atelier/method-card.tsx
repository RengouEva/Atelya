"use client";

import * as React from "react";
import { Check, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/atelier/pieces";

export function MethodCard({
  steps,
  checked,
  onToggle,
}: {
  steps: string[];
  checked: Set<number>;
  onToggle: (i: number) => void;
}) {
  return (
    <section
      aria-label="Méthode de coupe pas à pas"
      className="card-luxe rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <ListChecks className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Méthode de coupe pas à pas
          </h2>
          <p className="text-xs text-muted-foreground">
            Touchez une étape pour la cocher
          </p>
        </div>
        <ProgressRing value={checked.size} total={steps.length} size={44} />
      </header>

      <div className="px-5 pb-5 pt-3">
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: steps.length ? `${(checked.size / steps.length) * 100}%` : "0%",
            }}
          />
        </div>
        <ol className="flex flex-col">
          {steps.map((s, i) => {
            const done = checked.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() => onToggle(i)}
                  aria-pressed={done}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    done ? "opacity-70" : "hover:bg-accent/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-all",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm leading-relaxed transition-all",
                      done && "line-through decoration-primary/50"
                    )}
                  >
                    {s}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
