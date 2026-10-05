"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Box, Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  accessoryByKey,
  type AccessoryKey,
  type CatalogModel,
  type ChosenAccessory,
} from "@/lib/atelier/garments";
import { FABRIC_PRESETS, type StudioMeasures } from "@/lib/studio/config";

/* Canvas WebGL chargé uniquement côté client */
const Garment3D = dynamic(() => import("@/components/atelier/garment-3d"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  ),
});

/**
 * Étape 03 — la confection 3D : le vêtement du catalogue, porté sur
 * mannequin, dans le tissu choisi. L'apprenti essaie les accessoires
 * proposés par l'atelier (boutons, fermeture, rivets, ceinture, poches,
 * nœud) et voit le résultat avant la première coupe.
 */
export function Step3D({
  model,
  measures,
  accessories,
  onAccessories,
  onFabric,
  projectId,
  onContinue,
}: {
  model: CatalogModel;
  measures: StudioMeasures;
  accessories: ChosenAccessory[];
  onAccessories: (a: ChosenAccessory[]) => void;
  onFabric: (c: string) => void;
  projectId: string | null;
  onContinue: () => void;
}) {
  const offered = model.accessories;

  const toggle = (k: AccessoryKey) => {
    const hit = accessories.find((a) => a.type === k);
    const next = hit
      ? accessories.filter((a) => a.type !== k)
      : [...accessories, { type: k, color: accessoryByKey(k)?.color || "#d4af37" }];
    onAccessories(next);
    void persist(next);
  };

  const persist = async (list: ChosenAccessory[]) => {
    if (!projectId) return;
    try {
      await fetch(`/api/studio/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessories: list, measures }),
      });
    } catch {
      /* la sélection reste valide côté interface */
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Vus 3D */}
      <section
        aria-label="Confection 3D"
        className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
      >
        <header className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3.5 sm:px-5">
          <div className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
            <Box className="size-[18px]" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold leading-tight">
              Essayage avant confection
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Tournez le mannequin, changez le tissu, essayez les accessoires.
            </p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto rounded-full border-primary/40 bg-primary/10 font-normal text-primary"
          >
            {model.name}
          </Badge>
        </header>

        <div className="h-[420px] bg-gradient-to-b from-accent/40 to-background sm:h-[480px]">
          <Garment3D
            category={model.category}
            shape={model.shape}
            fabricColor={measures.C}
            accessories={accessories}
          />
        </div>

        {/* Coloris du tissu */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3 sm:px-5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Tissu
          </span>
          {FABRIC_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onFabric(c)}
              aria-label={`Tissu ${c}`}
              aria-pressed={measures.C === c}
              className={cn(
                "size-7 rounded-full border-2 outline-none ring-primary/50 transition focus-visible:ring-2",
                measures.C === c ? "border-foreground shadow-md" : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </section>

      {/* Accessoires proposés par le modèle */}
      <section aria-label="Accessoires" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <h3 className="font-display text-[15px] font-bold">
          Accessoires de finition
        </h3>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Sélection proposée par l&apos;atelier pour ce modèle — touchez pour
          essayer sur le vêtement.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {offered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ce modèle se confectionne sans accessoires.
            </p>
          )}
          {offered.map((k) => {
            const def = accessoryByKey(k);
            if (!def) return null;
            const active = accessories.some((a) => a.type === k);
            return (
              <button
                key={k}
                onClick={() => toggle(k)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold outline-none ring-primary/50 transition focus-visible:ring-2",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 bg-background text-foreground hover:border-primary/40"
                )}
              >
                {active ? <Check className="size-3.5" /> : <span className="size-2.5 rounded-full" style={{ backgroundColor: def.color || measures.C }} />}
                {def.label}
              </button>
            );
          })}
        </div>
      </section>

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
