"use client";

import * as React from "react";
import {
  ArrowRight,
  ImagePlus,
  Loader2,
  MousePointerClick,
  Puzzle,
  RotateCcw,
  Ruler,
  Scissors,
  Sparkles,
  TriangleAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FabricJourney } from "@/components/atelier/fabric-journey";
import { FabricTable } from "@/components/atelier/fabric-table";
import { ModelIcon, PieceMini, ProgressRing } from "@/components/atelier/pieces";
import { GarmentPreview } from "@/components/atelier/garment-preview";
import { LETTERS, MODELS, buildLayout, meterage } from "@/lib/atelier/patterns";
import type { Measures, ModelKey } from "@/lib/atelier/patterns";
import type { StudioMeasures, StudioVariant } from "@/lib/studio/config";

/**
 * Étape 03 — la découpe : toutes les pièces nécessaires au vêtement,
 * le plan de placement sur le tissu (métrage calculé), la coupe animée
 * pièce par pièce et le visuel IA des pièces en situation.
 */
export function StepCutting({
  modelKey,
  mm,
  measures,
  variant,
  onContinue,
}: {
  modelKey: ModelKey;
  mm: Measures;
  measures: StudioMeasures;
  variant: StudioVariant | null;
  onContinue: () => void;
}) {
  const model = MODELS[modelKey];
  const sa = measures.S || 0;
  const fw = measures.W || 140;

  const defs = React.useMemo(() => model.g(mm), [model, mm]);
  const layout = React.useMemo(() => buildLayout(defs, sa, fw), [defs, sa, fw]);
  const meters = meterage(layout);
  const tooNarrow = layout.mx > layout.raw;
  const total = layout.pieces.length;

  /* Session de coupe (copie du moteur de l'atelier) */
  const [cut, setCut] = React.useState<Set<number>>(new Set());
  const [cuttingId, setCuttingId] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const cutRef = React.useRef<Set<number>>(new Set());
  const busyRef = React.useRef<number | false>(false);

  const runCut = (id: number) => {
    return new Promise<void>((resolve) => {
      if (cutRef.current.has(id) || busyRef.current !== false) {
        resolve();
        return;
      }
      busyRef.current = id;
      setCuttingId(id);
      window.setTimeout(() => {
        const next = new Set(cutRef.current);
        next.add(id);
        cutRef.current = next;
        setCut(next);
        setCuttingId(null);
        busyRef.current = false;
        if (next.size === total) {
          toast.success("Toutes les pièces sont coupées !", {
            description: "Passez à l'assemblage, couture par couture.",
          });
        }
        resolve();
      }, 950);
    });
  };

  const cutAll = async () => {
    if (busyRef.current !== false) return;
    for (const p of layout.pieces) {
      if (cutRef.current.has(p.id)) continue;
      await runCut(p.id);
    }
  };

  const resetCut = () => {
    cutRef.current = new Set();
    setCut(new Set());
    setCuttingId(null);
    busyRef.current = false;
  };

  /* Visuel IA — pièces en situation */
  const [pv, setPv] = React.useState<{
    status: "idle" | "loading" | "done" | "error";
    url?: string;
  }>({ status: "idle" });

  const genPiecesVisual = async () => {
    if (!variant) return;
    setPv({ status: "loading" });
    try {
      const r = await fetch("/api/studio/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantSig: variant.sig }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error ?? "Génération impossible.");
      setPv({ status: "done", url: j.url });
      toast.success("Visuel IA prêt.", {
        description: "Les pièces sont mises en scène sur la table de coupe.",
      });
    } catch (e) {
      setPv({ status: "error" });
      toast.error(e instanceof Error ? e.message : "Génération impossible.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Résumé haut */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
          <ModelIcon kind={modelKey} className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold leading-tight">
            Patron établi sur vos mesures
          </h2>
          <p className="text-xs text-muted-foreground">
            {model.n} · {total} pièces · métrage {meters} m en {layout.raw} cm
            de laize
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden h-16 w-12 overflow-hidden rounded-lg border border-border/60 bg-accent/30 sm:block">
            <GarmentPreview
              m={mm}
              modelKey={modelKey}
              fc={measures.C}
              className="h-16 w-full"
              label="Aperçu du vêtement"
            />
          </div>
          <ProgressRing value={cut.size} total={total} size={44} />
        </div>
      </div>

      {/* La méthode réelle en 5 gestes — vraies photos */}
      <FabricJourney />

      {/* Plan de coupe */}
      <section
        aria-label="Plan de coupe"
        className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
      >
        <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Scissors className="size-4 text-primary" />
            Plan de placement
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/40 bg-primary/10 font-normal text-primary"
          >
            <Scissors className="size-3.5" />
            Geste 3 · Découper
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-border/80 bg-background font-normal"
          >
            <Ruler className="size-3.5 text-primary" />
            <b className="tabular-nums">{meters} m</b>
          </Badge>
          <p className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground md:flex">
            <MousePointerClick className="size-3" />
            Touchez une pièce pour la couper
          </p>
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
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={cutAll} disabled={cut.size === total} className="rounded-lg">
              <Scissors className="size-4" />
              Tout couper
            </Button>
            <Button variant="outline" onClick={resetCut} className="rounded-lg">
              <RotateCcw className="size-4" />
              Recommencer
            </Button>
            <Button
              variant="outline"
              onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              className="rounded-lg"
            >
              {zoom === 1 ? <ZoomIn className="size-4" /> : <ZoomOut className="size-4" />}
              {zoom === 1 ? "Zoom ×2" : "Zoom ×1"}
            </Button>
          </div>
          <FabricTable
            layout={layout}
            fc={measures.C}
            sa={sa}
            cut={cut}
            cuttingId={cuttingId}
            onCut={(id) => void runCut(id)}
            zoom={zoom}
          />
        </div>
      </section>

      {/* Nomenclature + visuel IA */}
      <div className="grid gap-5 md:grid-cols-2">
        <section
          aria-label="Les pièces à couper"
          className="card-luxe rounded-2xl border border-border/70 bg-card"
        >
          <header className="flex flex-wrap items-center gap-2.5 border-b border-border/60 px-5 py-4">
            <div className="w-full">
              <h3 className="font-display text-[17px] font-bold">
                Toutes les pièces nécessaires
              </h3>
              <p className="text-xs text-muted-foreground">
                Nomenclature A, B, C… avec dimensions réelles
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/40 bg-primary/10 font-normal text-primary"
            >
              <Puzzle className="size-3.5" />
              Geste 4 · Réunir
            </Badge>
          </header>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {defs.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-background p-3"
              >
                <PieceMini p={p} fc={measures.C} sa={sa} letter={LETTERS[i]} />
                <p className="mt-2 truncate text-sm font-semibold">
                  {LETTERS[i]} – {p.n}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {Math.round(p.w)} × {Math.round(p.h)} cm – {p.q} pièce
                  {p.q > 1 ? "s" : ""}
                  {p.fold ? ", au pli" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Visuel IA des pièces en situation"
          className="card-luxe flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card"
        >
          <header className="border-b border-border/60 px-5 py-4">
            <h3 className="flex items-center gap-2 font-display text-[17px] font-bold">
              <Sparkles className="size-4 text-primary" />
              Visuel IA — pièces en situation
            </h3>
            <p className="text-xs text-muted-foreground">
              Le patron papier épinglé sur le tissu, généré depuis votre
              variante retenue.
            </p>
          </header>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-accent/30">
            {pv.status === "done" && pv.url && (
              <>
                { }
                <img
                  src={pv.url}
                  alt="Pièces du patron posées sur le tissu — visuel IA"
                  className="absolute inset-0 size-full object-cover"
                />
                <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/85 px-2.5 text-[10px] font-semibold text-foreground backdrop-blur">
                  <Sparkles className="size-3 text-primary" />
                  Généré par IA
                </Badge>
              </>
            )}
            {pv.status === "loading" && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-accent/70 via-background to-accent/40" />
                <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <p className="text-xs font-semibold">L&apos;IA met en scène les pièces…</p>
                  <p className="text-[11px] text-muted-foreground">20 à 60 s</p>
                </div>
              </div>
            )}
            {(pv.status === "idle" || pv.status === "error") && (
              <div className="absolute inset-0 grid place-items-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="grid size-12 place-items-center rounded-full border border-dashed border-border bg-background/70">
                    <ImagePlus className="size-5 text-muted-foreground" />
                  </span>
                  <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                    {pv.status === "error"
                      ? "Génération impossible pour le moment — réessayez."
                      : "Un clic pour photographier la table de coupe avec vos pièces."}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-auto p-4">
            <Button
              variant={pv.status === "done" ? "outline" : "default"}
              onClick={() => void genPiecesVisual()}
              disabled={pv.status === "loading" || !variant}
              className="w-full gap-1.5 rounded-lg"
            >
              {pv.status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {pv.status === "done" ? "Nouvelle mise en scène" : "Générer le visuel"}
            </Button>
          </div>
        </section>
      </div>

      <Button
        onClick={onContinue}
        size="lg"
        className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-13 w-full rounded-full text-[15px] font-bold shadow-lg"
      >
        Passer à l&apos;assemblage
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
