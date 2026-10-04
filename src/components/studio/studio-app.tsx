"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Plus,
  RotateCcw,
  Ruler,
  Sparkles,
  GitMerge,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StepCreate } from "@/components/studio/step-create";
import { StepVariants } from "@/components/studio/step-variants";
import { StepPatronage } from "@/components/studio/step-patronage";
import { StepAssembly } from "@/components/studio/step-assembly";
import { MODELS, buildLayout, meterage } from "@/lib/atelier/patterns";
import {
  DEFAULT_MEASURES,
  familyByKey,
  type FamilyKey,
  type StudioMeasures,
  type StudioVariant,
} from "@/lib/studio/config";

const STEP_LABELS = [
  { icon: Camera, t: "Modèle" },
  { icon: Ruler, t: "Patronage" },
  { icon: GitMerge, t: "Assemblage" },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Studio Atelya — parcours mobile-first en 3 gestes :
 * ① modèle (photo + variantes IA) ② patronage ③ méthode d'assemblage visuelle
 * jusqu'à l'habit. Une seule colonne, un stepper compact, droit au but.
 */
export function StudioApp({ onHome }: { onHome: () => void }) {
  const [step, setStep] = React.useState(0);

  /* projet */
  const [name, setName] = React.useState("");
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [family, setFamily] = React.useState<FamilyKey>("robe");
  const [measures, setMeasures] = React.useState<StudioMeasures>(DEFAULT_MEASURES);
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  /* variantes */
  const [variants, setVariants] = React.useState<(StudioVariant | null)[]>([
    null,
    null,
    null,
  ]);
  const [selected, setSelected] = React.useState(-1);

  /* dérivés du patron (étapes 3 & 4) */
  const modelKey = familyByKey(family).model;
  const mm = React.useMemo(
    () => ({
      P: clamp(measures.P || 90, 60, 160),
      T: clamp(measures.T || 70, 40, 160),
      H: clamp(measures.H || 98, 60, 180),
      L: clamp(measures.L || familyByKey(family).L, 15, 200),
    }),
    [measures.P, measures.T, measures.H, measures.L, family]
  );
  const defs = React.useMemo(() => MODELS[modelKey].g(mm), [modelKey, mm]);
  const layout = React.useMemo(
    () => buildLayout(defs, measures.S || 0, measures.W || 140),
    [defs, measures.S, measures.W]
  );
  const meters = meterage(layout);
  const selectedVariant = selected >= 0 ? variants[selected] : null;

  const changeFamily = (f: FamilyKey) => {
    setFamily(f);
    setMeasures((m) => ({ ...m, L: familyByKey(f).L }));
  };

  /* Étape 1 → 2 : création du projet en base */
  const createProject = async () => {
    if (!photo || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), photo, family, measures }),
      });
      const j = (await r.json()) as { project?: { id: string }; error?: string };
      if (!r.ok || !j.project) throw new Error(j.error ?? "Création impossible.");
      setProjectId(j.project.id);
      toast.success("Projet créé — l'IA compose vos 3 variantes.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const newProject = () => {
    setStep(0);
    setName("");
    setPhoto(null);
    setFamily("robe");
    setMeasures(DEFAULT_MEASURES);
    setProjectId(null);
    setVariants([null, null, null]);
    setSelected(-1);
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
            { }
            <img src="/atelya-mark.webp" alt="" className="h-8 w-auto" />
            <span className="font-display text-[17px] font-bold tracking-tight">
              Atelya
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {photo && (
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
        <ol className="mx-auto grid w-full max-w-3xl grid-cols-3 px-3 py-2 sm:px-4">
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
      {photo && projectId && (
        <div className="mx-auto w-full max-w-3xl px-3 pt-3 sm:px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 card-luxe">
            { }
            <img
              src={photo}
              alt="Photo d'origine du projet"
              className="size-10 rounded-lg border border-border/60 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight">
                {name || "Sans nom"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {familyByKey(family).label} · {layout.pieces.length} pièces · {meters} m
                {selected >= 0 && selectedVariant ? ` · ${selectedVariant.label}` : ""}
              </p>
            </div>
            {selected >= 0 && selectedVariant && (
               
              <img
                src={selectedVariant.url}
                alt={`Variante retenue : ${selectedVariant.label}`}
                className="size-10 rounded-lg border-2 border-primary object-cover"
              />
            )}
          </div>
        </div>
      )}

      {/* Contenu de l'étape — une colonne */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-4">
        {step === 0 && !projectId && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepCreate
              name={name}
              onName={setName}
              photo={photo}
              onPhoto={setPhoto}
              family={family}
              onFamily={changeFamily}
              measures={measures}
              onMeasures={setMeasures}
              busy={busy}
              onSubmit={() => void createProject()}
            />
          </motion.div>
        )}
        {step === 0 && projectId && photo && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepVariants
              photo={photo}
              family={family}
              variants={variants}
              onVariants={setVariants}
              selected={selected}
              onSelected={setSelected}
              projectId={projectId}
              onContinue={() => goStep(1)}
            />
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepPatronage
              modelKey={modelKey}
              mm={mm}
              measures={measures}
              onContinue={() => goStep(2)}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <StepAssembly
              modelKey={modelKey}
              mm={mm}
              defs={defs}
              fc={measures.C}
              sa={measures.S || 0}
              variantUrl={selectedVariant?.url ?? null}
            />
          </motion.div>
        )}
        {step === 0 && projectId && !photo && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
            <Loader2 className="mb-2 size-5 animate-spin" />
            Chargement du projet…
          </div>
        )}

        {/* Nouveau projet — fin de parcours */}
        {step === 2 && (
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
      </footer>
    </div>
  );
}
