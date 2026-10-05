"use client";

import * as React from "react";
import { BadgeCheck, Ruler, Shirt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelIcon } from "@/components/atelier/pieces";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  type CatalogModel,
  type CategoryKey,
} from "@/lib/atelier/garments";
import { FABRIC_PRESETS, type StudioMeasures } from "@/lib/studio/config";

const MEASURE_FIELDS: { key: "P" | "T" | "H" | "L"; label: string }[] = [
  { key: "P", label: "Poitrine · 60–160" },
  { key: "T", label: "Taille · 40–160" },
  { key: "H", label: "Hanches · 60–180" },
  { key: "L", label: "Longueur · 15–200" },
];

/**
 * Étape 01 — le modèle : catalogue validé par l'encadrement, classé par
 * catégorie. L'apprenti choisit un modèle, nomme son projet, ajuste les
 * mesures de sa cliente — puis le patronage est établi.
 */
export function StepCatalog({
  models,
  selected,
  onSelect,
  name,
  onName,
  measures,
  onMeasures,
  busy,
  onSubmit,
}: {
  models: CatalogModel[];
  selected: CatalogModel | null;
  onSelect: (m: CatalogModel) => void;
  name: string;
  onName: (v: string) => void;
  measures: StudioMeasures;
  onMeasures: (m: StudioMeasures) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const [cat, setCat] = React.useState<CategoryKey | "all">("all");
  const shown = React.useMemo(
    () => (cat === "all" ? models : models.filter((m) => m.category === cat)),
    [models, cat]
  );

  const cats: (CategoryKey | "all")[] = ["all", ...CATEGORIES.map((c) => c.key)];
  const catLabel = (k: CategoryKey | "all") =>
    k === "all" ? "Tous" : CATEGORIES.find((c) => c.key === k)!.label;

  return (
    <div className="flex flex-col gap-5">
      {/* Catégories */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((k) => (
          <button
            key={k}
            onClick={() => setCat(k)}
            aria-pressed={cat === k}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium outline-none ring-primary/50 transition focus-visible:ring-2",
              cat === k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-accent text-accent-foreground hover:bg-accent/70"
            )}
          >
            {catLabel(k)}
          </button>
        ))}
      </div>

      {/* Catalogue */}
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun modèle dans cette catégorie pour l&apos;instant — demandez à
          l&apos;encadrement d&apos;en publier depuis l&apos;espace atelier.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list" aria-label="Catalogue de modèles">
          {shown.map((m) => {
            const active = selected?.id === m.id;
            return (
              <button
                key={m.id}
                aria-pressed={active}
                onClick={() => onSelect(m)}
                className={cn(
                  "card-luxe group overflow-hidden rounded-2xl border bg-card text-left outline-none ring-primary/50 transition focus-visible:ring-2",
                  active
                    ? "border-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                    : "border-border/70 hover:border-primary/40"
                )}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-accent/40">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={`Modèle ${m.name}`}
                      className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-primary/70">
                      <ModelIcon kind={CATEGORIES.find((c) => c.key === m.category)!.icon} className="size-14" />
                    </span>
                  )}
                  {active && (
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <BadgeCheck className="size-4" />
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">
                    {CATEGORIES.find((c) => c.key === m.category)!.label}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-bold leading-tight">{m.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {m.description ?? `${m.pieces.length} pièces · sur mesures`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Projet */}
      <section className="card-luxe rounded-2xl border border-border/70 bg-card p-4 sm:p-5" aria-label="Projet et mesures">
        <div>
          <Label htmlFor="prj-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Nom du projet
          </Label>
          <Input
            id="prj-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Ex. Robe trapèze — Mme Léa"
            className="mt-2 rounded-xl"
            maxLength={60}
          />
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Shirt className="size-3.5" />
            Famille du vêtement
          </p>
          <div className="mt-2 rounded-xl border border-border/60 bg-accent/30 px-3 py-2.5 text-[13px] font-semibold">
            {selected
              ? CATEGORIES.find((c) => c.key === selected.category)!.label +
                ` — ${selected.name}`
              : "Choisissez un modèle dans le catalogue"}
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Ruler className="size-3.5" />
            Mesures de la cliente (cm)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEASURE_FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`ms-${f.key}`} className="text-[11px] font-medium">
                  {f.label}
                </Label>
                <Input
                  id={`ms-${f.key}`}
                  type="number"
                  inputMode="numeric"
                  value={String(measures[f.key])}
                  onChange={(e) => onMeasures({ ...measures, [f.key]: +e.target.value || 0 })}
                  className="mt-1 rounded-xl px-2 text-center"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="ms-w" className="text-[11px] font-medium">
                Laize du tissu
              </Label>
              <Input
                id="ms-w"
                type="number"
                value={String(measures.W)}
                onChange={(e) => onMeasures({ ...measures, W: +e.target.value || 0 })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="ms-s" className="text-[11px] font-medium">
                Marge de couture
              </Label>
              <Input
                id="ms-s"
                type="number"
                step="0.5"
                value={String(measures.S)}
                onChange={(e) => onMeasures({ ...measures, S: +e.target.value || 0 })}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Coloris du tissu
            </span>
            {FABRIC_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => onMeasures({ ...measures, C: c })}
                aria-label={`Coloris ${c}`}
                aria-pressed={measures.C === c}
                className={cn(
                  "size-6 rounded-full border-2 outline-none ring-primary/50 transition focus-visible:ring-2",
                  measures.C === c ? "border-foreground shadow-md" : "border-transparent hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </section>

      <Button
        onClick={onSubmit}
        disabled={!selected || !name.trim() || busy}
        size="lg"
        className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-13 w-full rounded-full text-[15px] font-bold shadow-lg"
      >
        {busy ? "Création…" : "Établir le patronage"}
      </Button>
    </div>
  );
}
