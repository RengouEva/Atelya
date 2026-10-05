"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Box,
  Check,
  GitMerge,
  Plus,
  RotateCcw,
  Ruler,
  Shirt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StepCatalog } from "@/components/studio/step-catalog";
import { StepPatronage } from "@/components/studio/step-patronage";
import { Step3D } from "@/components/studio/step-3d";
import { StepAssembly } from "@/components/studio/step-assembly";
import { buildLayout, meterage } from "@/lib/atelier/patterns";
import {
  categoryByKey,
  scaledPieces,
  type CatalogModel,
  type ChosenAccessory,
} from "@/lib/atelier/garments";
import {
  DEFAULT_MEASURES,
  type StudioMeasures,
} from "@/lib/studio/config";

const STEP_LABELS = [
  { icon: Shirt, t: "Modèle" },
  { icon: Ruler, t: "Patronage" },
  { icon: Box, t: "3D" },
  { icon: GitMerge, t: "Assemblage" },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Studio Atelya — parcours mobile-first en 4 gestes :
 * ① modèle (catalogue validé par l'encadrement) ② patronage ajusté aux
 * mesures ③ confection 3D avec accessoires ④ méthode d'assemblage visuelle.
 * On voit le vêtement avant de le produire physiquement.
 */
export function StudioApp({ onHome }: { onHome: () => void }) {
  const [step, setStep] = React.useState(0);

  /* catalogue atelier */
  const [models, setModels] = React.useState<CatalogModel[]>([]);
  const [model, setModel] = React.useState<CatalogModel | null>(null);

  /* projet */
  const [name, setName] = React.useState("");
  const [measures, setMeasures] = React.useState<StudioMeasures>(DEFAULT_MEASURES);
  const [accessories, setAccessories] = React.useState<ChosenAccessory[]>([]);
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((j: { models?: CatalogModel[] }) => setModels(j.models ?? []))
      .catch(() => setModels([]));
  }, []);

  /* dérivés du patronage (récapitulatif + étapes 2 & 4) */
  const mm = React.useMemo(
    () => ({
      P: clamp(measures.P || 90, 60, 160),
      T: clamp(measures.T || 70, 40, 160),
      H: clamp(measures.H || 98, 60, 180),
      L: clamp(measures.L || 60, 15, 200),
    }),
    [measures.P, measures.T, measures.H, measures.L]
  );
  const defs = React.useMemo(
    () => (model ? scaledPieces(model.pieces, model.baseMeasures, measures) : []),
    [model, measures]
  );
  const layout = React.useMemo(
    () => buildLayout(defs, measures.S || 0, measures.W || 140),
    [defs, measures.S, measures.W]
  );
  const meters = meterage(layout);

  const selectModel = (m: CatalogModel) => {
    setModel(m);
    setMeasures((mm2) => ({ ...mm2, L: m.shape.length || m.baseMeasures.L }));
    setAccessories([]);
  };

  /* Étape 1 → 2 : création du projet en base */
  const createProject = async () => {
    if (!model || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), modelId: model.id, measures }),
      });
      const j = (await r.json()) as { project?: { id: string }; error?: string };
      if (!r.ok || !j.project) throw new Error(j.error ?? "Création impossible.");
      setProjectId(j.project.id);
      setStep(1);
      toast.success("Projet créé — patronage établi sur vos mesures.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const newProject = () => {
    setStep(0);
    setName("");
    setModel(null);
    setMeasures(DEFAULT_MEASURES);
    setAccessories([]);
    setProjectId(null);
    window.scrollTo({ top: 0 });
  };

  const goStep = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex min-h-[100svh] flex-col">
      {/* En-tête native : retour · marque · thème */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-3 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            className="-ml-1 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Accueil</span>
          </Button>

          <button
            onClick={onHome}
            className="flex items-center gap-2 rounded-xl outline-none ring-primary/50 transition hover:opacity-85 focus-visible:ring-2"
            aria-label="Atelya"
          >
            <img src="/atelya-mark.webp" alt="" className="h-8 w-auto" />
            <span className="font-display text-[17px] font-bold tracking-tight">
              Atelya
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {model && (
              <Button
                variant="ghost"
                size="icon"
                onClick={newProject}
                aria-label="Nouveau projet"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Stepper horizontal compact */}
      <nav
        aria-label="Étapes du parcours"
        className="sticky top-14 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md"
      >
        <ol className="mx-auto grid w-full max-w-3xl grid-cols-4 px-3 py-2 sm:px-4">
          {STEP_LABELS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <li key={s.t} className="relative">
                <button
                  onClick={() => {
                    if (done) goStep(i);
                  }}
                  disabled={i > step}
                  aria-current={active ? "step" : undefined}
                  className="flex w-full flex-col items-center gap-1 rounded-lg px-1 py-1 outline-none ring-primary/50 transition focus-visible:ring-2"
                >
                  <span
                    className={`grid size-7 place-items-center rounded-full text-[11px] font-bold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
                        : done
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground/60"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  <span
                    className={`text-[10px] font-semibold tracking-wide ${
                      active
                        ? "text-foreground"
                        : done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {s.t}
                  </span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <span
                    className={`absolute right-[-15%] top-[15px] h-[2px] w-[30%] rounded-full ${
                      i < step ? "bg-primary/60" : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Récapitulatif projet — bandeau fin */}
      {model && projectId && (
        <div className="mx-auto w-full max-w-3xl px-3 pt-3 sm:px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 card-luxe">
            {model.photo ? (
              <img
                src={model.photo}
                alt=""
                className="size-10 rounded-lg border border-border/60 object-cover"
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                <Shirt className="size-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight">
                {name || "Sans nom"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {categoryByKey(model.category).label} · {layout.pieces.length} pièces ·{" "}
                {meters} m
                {accessories.length > 0 ? ` · ${accessories.length} accessoire(s)` : ""}
              </p>
            </div>
            <span
              className="size-6 shrink-0 rounded-full border-2 border-background shadow-sm"
              style={{ backgroundColor: measures.C }}
              aria-label="Coloris du tissu"
            />
          </div>
        </div>
      )}

      {/* Contenu de l'étape — une colonne */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-4">
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepCatalog
              models={models}
              selected={model}
              onSelect={selectModel}
              name={name}
              onName={setName}
              measures={measures}
              onMeasures={setMeasures}
              busy={busy}
              onSubmit={() => void createProject()}
            />
          </motion.div>
        )}
        {step === 1 && model && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepPatronage
              model={model}
              measures={measures}
              onContinue={() => goStep(2)}
            />
          </motion.div>
        )}
        {step === 2 && model && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Step3D
              model={model}
              measures={measures}
              accessories={accessories}
              onAccessories={setAccessories}
              onFabric={(c) => setMeasures((m) => ({ ...m, C: c }))}
              projectId={projectId}
              onContinue={() => goStep(3)}
            />
          </motion.div>
        )}
        {step === 3 && model && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepAssembly model={model} mm={mm} defs={defs} fc={measures.C} sa={measures.S || 0} />
          </motion.div>
        )}

        {/* Nouveau projet — fin de parcours */}
        {step === 3 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={newProject}
              className="gap-1.5 rounded-full px-5 text-[13px] font-semibold"
            >
              <Plus className="size-4" />
              Nouveau projet
            </Button>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/50 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Créez&nbsp;&nbsp;•&nbsp;&nbsp;Mesurez&nbsp;&nbsp;•&nbsp;&nbsp;Réalisez
        </p>
        <a
          href="/admin"
          className="mt-1.5 inline-block text-[11px] text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground"
        >
          Espace atelier
        </a>
      </footer>
    </div>
  );
}
