"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Plus,
  Scissors,
  Sparkles,
  GitMerge,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StepCreate } from "@/components/studio/step-create";
import { StepVariants } from "@/components/studio/step-variants";
import { StepCutting } from "@/components/studio/step-cutting";
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
  { icon: Camera, t: "Photo du modèle" },
  { icon: Sparkles, t: "Variantes IA" },
  { icon: Scissors, t: "Découpe" },
  { icon: GitMerge, t: "Assemblage" },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Studio du styliste-modéliste — parcours en 4 étapes :
 * ① photo du modèle ② 3 variantes IA sur mannequin ③ découpe
 * (pièces + plan de placement) ④ assemblage pas à pas.
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
      setStep(1);
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

  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3">
          <button
            onClick={onHome}
            className="flex items-center gap-2.5 rounded-xl outline-none ring-primary/50 transition hover:opacity-85 focus-visible:ring-2"
            aria-label="Retour à l'accueil"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white shadow-sm">
              <Scissors className="size-[18px]" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-[17px] font-bold">
                Studio de coupe
              </span>
              <span className="block text-[11px] text-muted-foreground">
                photo · variantes IA · patron · assemblage
              </span>
            </span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={onHome}
            className="ml-1 gap-1 rounded-full px-3 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            Accueil
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="secondary"
              className="hidden gap-1 rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground md:flex"
            >
              <Sparkles className="size-3 text-primary" />
              Propulsé par IA
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 pt-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Du croquis au vêtement,{" "}
            <span className="bg-gradient-to-r from-[#D6336C] to-[#F0703F] bg-clip-text text-transparent dark:from-[#FF6B9A] dark:to-[#FFA94D]">
              en quatre gestes
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Déposez la photo de votre modèle : l&apos;IA propose trois
            variantes habillées sur mannequin, établit toutes les pièces du
            patron avec leur plan de placement, puis guide votre assemblage
            couture par couture.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Barre latérale : progression + récapitulatif */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <nav
              aria-label="Étapes du parcours"
              className="card-luxe rounded-2xl border border-border/70 bg-card p-3"
            >
              <ol className="flex flex-col gap-1">
                {STEP_LABELS.map((s, i) => {
                  const Icon = s.icon;
                  const active = i === step;
                  const done = i < step;
                  return (
                    <li key={s.t}>
                      <button
                        onClick={() => {
                          if (i < step) setStep(i);
                        }}
                        disabled={i > step}
                        aria-current={active ? "step" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none ring-primary/50 transition focus-visible:ring-2 ${
                          active
                            ? "bg-accent font-semibold text-accent-foreground"
                            : done
                              ? "text-muted-foreground hover:bg-accent/50"
                              : "text-muted-foreground/60"
                        }`}
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : done
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Icon className="size-4 shrink-0" />
                        {s.t}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Récapitulatif projet */}
            {photo && (
              <div className="card-luxe rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Projet en cours
                </p>
                <p className="mt-1 truncate font-display text-sm font-bold">
                  {name || "Sans nom"}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  { }
                  <img
                    src={photo}
                    alt="Photo d'origine du projet"
                    className="size-14 rounded-lg border border-border/60 object-cover"
                  />
                  {selectedVariant && (
                    <>
                      { }
                      <img
                        src={selectedVariant.url}
                        alt={`Variante retenue : ${selectedVariant.label}`}
                        className="size-14 rounded-lg border-2 border-primary object-cover"
                      />
                    </>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                  <div>
                    <dt className="text-muted-foreground">Famille</dt>
                    <dd className="font-semibold">{familyByKey(family).label}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pièces</dt>
                    <dd className="font-semibold tabular-nums">
                      {layout.pieces.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Métrage</dt>
                    <dd className="font-semibold tabular-nums">{meters} m</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Variante</dt>
                    <dd className="font-semibold">
                      {selected >= 0 ? selectedVariant?.label : "—"}
                    </dd>
                  </div>
                </dl>
                {step > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={newProject}
                    className="mt-4 w-full gap-1 rounded-lg text-xs"
                  >
                    <Plus className="size-3.5" />
                    Nouveau projet
                  </Button>
                )}
              </div>
            )}
          </aside>

          {/* Contenu de l'étape */}
          <div className="min-w-0">
            {step === 0 && (
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
            {step === 1 && photo && (
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
                  onContinue={() => {
                    setStep(2);
                    window.scrollTo({ top: 0 });
                  }}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <StepCutting
                  modelKey={modelKey}
                  mm={mm}
                  measures={measures}
                  variant={selectedVariant}
                  onContinue={() => {
                    setStep(3);
                    window.scrollTo({ top: 0 });
                  }}
                />
              </motion.div>
            )}
            {step === 3 && (
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
                />
              </motion.div>
            )}
            {step === 1 && !photo && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
                <Loader2 className="mb-2 size-5 animate-spin" />
                Chargement du projet…
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/60 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-xs text-muted-foreground">
          Studio de coupe — de la photo du modèle au vêtement fini, l&apos;IA
          tient la craie, vous tenez les ciseaux.
        </p>
      </footer>
    </div>
  );
}
