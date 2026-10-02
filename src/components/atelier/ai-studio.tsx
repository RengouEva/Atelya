"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ImagePlus,
  Loader2,
  Palette,
  RefreshCw,
  Scissors,
  Shirt,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Measures, ModelKey } from "@/lib/atelier/patterns";

type Kind = "garment" | "fabric" | "pieces";

interface KindState {
  status: "idle" | "loading" | "done" | "error";
  url?: string;
  prompt?: string;
  error?: string;
  cached?: boolean;
}

const TABS: {
  key: Kind;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  ratio: string;
}[] = [
  {
    key: "garment",
    label: "Produit fini",
    hint: "Le vêtement terminé, porté sur un mannequin de couturier",
    icon: Shirt,
    cta: "Photographier le vêtement fini",
    ratio: "aspect-[3/4]",
  },
  {
    key: "fabric",
    label: "Texture du tissu",
    hint: "Gros plan réaliste sur la matière et le coloris choisis",
    icon: Palette,
    cta: "Générer la texture du tissu",
    ratio: "aspect-square",
  },
  {
    key: "pieces",
    label: "Pièces en situation",
    hint: "Le patron papier épinglé sur le tissu, table de coupe en vue du dessus",
    icon: Scissors,
    cta: "Mettre en scène les pièces",
    ratio: "aspect-[4/3]",
  },
];

/**
 * Studio IA — génère des photographies réalistes du projet en cours :
 * produit fini porté, texture du tissu, pièces du patron en situation.
 * Les images sont produites par le backend (z-ai-web-dev-sdk) et mises
 * en cache en base de données.
 */
export function AiStudio({
  modelKey,
  m,
  fc,
}: {
  modelKey: ModelKey;
  m: Measures;
  fc: string;
}) {
  const [kind, setKind] = React.useState<Kind>("garment");
  const [states, setStates] = React.useState<Record<Kind, KindState>>({
    garment: { status: "idle" },
    fabric: { status: "idle" },
    pieces: { status: "idle" },
  });
  const [elapsed, setElapsed] = React.useState(0);

  const tab = TABS.find((t) => t.key === kind)!;
  const st = states[kind];
  const loading = st.status === "loading";

  /* Chronomètre pendant la génération */
  React.useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t0 = Date.now();
    const iv = window.setInterval(
      () => setElapsed(Math.round((Date.now() - t0) / 1000)),
      1000
    );
    return () => window.clearInterval(iv);
  }, [loading, kind, modelKey, fc, m.L]);

  const generate = React.useCallback(
    async (k: Kind, nonce?: string) => {
      setStates((p) => ({
        ...p,
        [k]: { ...p[k], status: "loading", error: undefined },
      }));
      try {
        const r = await fetch("/api/ai/visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: k,
            model: modelKey,
            color: fc,
            L: m.L,
            nonce,
          }),
        });
        const j = (await r.json()) as {
          url?: string;
          prompt?: string;
          cached?: boolean;
          error?: string;
        };
        if (!r.ok || !j.url) throw new Error(j.error ?? "Génération impossible.");
        setStates((p) => ({
          ...p,
          [k]: {
            status: "done",
            url: j.url,
            prompt: j.prompt,
            cached: j.cached,
          },
        }));
        if (!j.cached) {
          toast.success("Visuel IA prêt.", {
            description: "Le visuel est conservé en base : il sera rechargé instantanément.",
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Génération impossible.";
        setStates((p) => ({ ...p, [k]: { status: "error", error: msg } }));
        toast.error(msg);
      }
    },
    [modelKey, fc, m.L]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label="Studio IA : visuels réalistes générés"
      className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white shadow-sm">
          <Sparkles className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Studio IA — visuels réalistes
          </h2>
          <p className="text-xs text-muted-foreground">
            Des photographies générées par intelligence artificielle, fidèles à
            votre modèle, votre tissu et votre coloris
          </p>
        </div>
        <Badge
          variant="outline"
          className="ml-auto hidden gap-1 rounded-full border-border/80 bg-background font-normal sm:inline-flex"
        >
          <Sparkles className="size-3.5 text-primary" />
          IA générative
        </Badge>
      </header>

      {/* Onglets */}
      <div
        role="tablist"
        aria-label="Types de visuels IA"
        className="flex gap-1.5 overflow-x-auto border-b border-border/60 px-4 py-2.5 sm:px-5"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const s = states[t.key];
          const active = t.key === kind;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setKind(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium outline-none ring-primary/50 transition focus-visible:ring-2",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-accent text-accent-foreground hover:bg-accent/70"
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {s.status === "done" && (
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    active ? "bg-primary-foreground/80" : "bg-primary"
                  )}
                  aria-label="Visuel disponible"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5" role="tabpanel" aria-label={tab.label}>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {tab.hint}
        </p>

        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-accent/50 via-background to-background",
            tab.ratio
          )}
        >
          {/* Terminé */}
          {st.status === "done" && st.url && (
            <>
              { }
              <img
                src={st.url}
                alt={`Visuel IA : ${tab.label.toLowerCase()} du modèle ${modelKey}`}
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
              />
              <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/85 px-2.5 text-[10px] font-semibold text-foreground backdrop-blur">
                <Sparkles className="size-3 text-primary" />
                Généré par IA
              </Badge>
            </>
          )}

          {/* Chargement */}
          {loading && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-accent/70 via-background to-accent/40" />
              <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-background shadow-sm">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </span>
                <p className="text-sm font-semibold">
                  L&apos;IA compose votre visuel… {elapsed} s
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  La génération prend généralement 20 à 60 secondes. Le résultat
                  est ensuite mis en cache.
                </p>
              </div>
            </div>
          )}

          {/* Erreur */}
          {st.status === "error" && (
            <div className="absolute inset-0 grid place-items-center px-6">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <TriangleAlert className="size-6 text-destructive" />
                <p className="text-sm font-semibold">
                  Génération impossible pour le moment
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {st.error}{" "}
                  <button
                    onClick={() => void generate(kind)}
                    className="font-semibold text-primary underline underline-offset-2 outline-none ring-primary/50 focus-visible:ring-2"
                  >
                    Réessayer
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* À générer */}
          {st.status === "idle" && (
            <div className="absolute inset-0 grid place-items-center px-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="grid size-12 place-items-center rounded-full border border-dashed border-border bg-background/70">
                  <ImagePlus className="size-5 text-muted-foreground" />
                </span>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  {tab.hint}. L&apos;image sera calculée à partir du modèle,
                  du tissu conseillé et de votre coloris.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {st.status === "done" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void generate(kind, Date.now().toString(36))}
                disabled={loading}
                className="gap-1.5 rounded-lg"
              >
                <RefreshCw className="size-3.5" />
                Nouvelle variation
              </Button>
              <p className="text-xs text-muted-foreground">
                Chaque variation est conservée : revenir sur le même réglage
                l&apos;affiche instantanément.
              </p>
            </>
          ) : (
            <Button
              onClick={() => void generate(kind)}
              disabled={loading}
              className="gap-1.5 rounded-lg"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {loading ? "Génération en cours" : tab.cta}
            </Button>
          )}
        </div>

        {/* Prompt (transparence) */}
        {st.prompt && (
          <details className="group mt-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wider text-muted-foreground outline-none ring-primary/50 focus-visible:ring-2">
              Prompt envoyé à l&apos;IA
            </summary>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {st.prompt}
            </p>
          </details>
        )}
      </div>
    </motion.section>
  );
}
