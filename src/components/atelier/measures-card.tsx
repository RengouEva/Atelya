"use client";

import * as React from "react";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FABRIC_PRESETS = [
  "#2A9DB5",
  "#C96F4A",
  "#D9A441",
  "#7D4E7E",
  "#4A7C59",
  "#33507A",
  "#C25E6E",
  "#4B4F5C",
];

export type MeasureField = "P" | "T" | "H" | "L" | "W" | "S" | "C";

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
}) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative mt-1.5">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-lg pr-10 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          cm
        </span>
      </div>
    </div>
  );
}

export function MeasuresCard({
  P,
  T,
  H,
  L,
  W,
  S,
  C,
  set,
}: {
  P: string;
  T: string;
  H: string;
  L: string;
  W: string;
  S: string;
  C: string;
  set: (k: MeasureField, v: string) => void;
}) {
  return (
    <section
      aria-label="Mesures"
      className="card-luxe rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <Ruler className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Mesures
          </h2>
          <p className="text-xs text-muted-foreground">
            Le patron se recalcule à chaque saisie
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-5 pb-5 pt-4">
        <NumField label="Poitrine" value={P} onChange={(v) => set("P", v)} />
        <NumField label="Taille" value={T} onChange={(v) => set("T", v)} />
        <NumField label="Hanches" value={H} onChange={(v) => set("H", v)} />
        <NumField label="Longueur" value={L} onChange={(v) => set("L", v)} />
        <NumField
          label="Largeur tissu"
          value={W}
          onChange={(v) => set("W", v)}
        />
        <NumField
          label="Couture"
          value={S}
          onChange={(v) => set("S", v)}
          step={0.5}
        />

        <div className="col-span-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Couleur du tissu
          </Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {FABRIC_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => set("C", c)}
                aria-label={`Couleur ${c}`}
                aria-pressed={c === C}
                className={cn(
                  "size-8 rounded-full border-2 transition-all duration-200",
                  c === C
                    ? "scale-110 border-foreground shadow-sm"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={C}
              onChange={(e) => set("C", e.target.value)}
              aria-label="Couleur personnalisée"
              className="size-8 cursor-pointer rounded-full border border-border bg-card p-0.5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
