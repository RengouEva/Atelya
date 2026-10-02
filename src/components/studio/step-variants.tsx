"use client";

import * as React from "react";
import { Check, Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DIRECTIONS,
  type FamilyKey,
  type StudioVariant,
} from "@/lib/studio/config";

type DirStatus = "idle" | "loading" | "error";

/**
 * Étape 02 — l'IA propose 3 variantes du modèle, bien habillées et
 * portées sur mannequin. Les 3 générations partent en parallèle ;
 * chaque carte se remplit dès que sa proposition est prête.
 */
export function StepVariants({
  photo,
  family,
  variants,
  onVariants,
  selected,
  onSelected,
  projectId,
  onContinue,
}: {
  photo: string;
  family: FamilyKey;
  variants: (StudioVariant | null)[];
  onVariants: (v: (StudioVariant | null)[]) => void;
  selected: number;
  onSelected: (i: number) => void;
  projectId: string | null;
  onContinue: () => void;
}) {
  const [status, setStatus] = React.useState<DirStatus[]>([
    "idle",
    "idle",
    "idle",
  ]);
  const startedRef = React.useRef(false);

  const generate = React.useCallback(
    async (direction: number, nonce?: string) => {
      setStatus((p) => {
        const n = [...p];
        n[direction] = "loading";
        return n;
      });
      try {
        const r = await fetch("/api/studio/variant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo, family, direction, nonce }),
        });
        const j = (await r.json()) as StudioVariant & { error?: string };
        if (!r.ok || !j.url) throw new Error(j.error ?? "Génération impossible.");
        onVariants((prev) => {
          const n = [...prev];
          n[direction] = {
            sig: j.sig,
            url: j.url,
            label: j.label,
            desc: j.desc,
            direction,
          };
          return n;
        });
        setStatus((p) => {
          const n = [...p];
          n[direction] = "idle";
          return n;
        });
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Génération impossible.",
          { description: `Variante « ${DIRECTIONS[direction].label} »` }
        );
        setStatus((p) => {
          const n = [...p];
          n[direction] = "error";
          return n;
        });
      }
    },
    [photo, family, onVariants]
  );

  /* Lancement des 3 directions au premier affichage, en décalé pour
     éviter le rate-limiting de l'API d'images (429). */
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const timers = DIRECTIONS.map((_, d) =>
      window.setTimeout(() => {
        if (!variants[d]) void generate(d);
      }, d * 1500)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const doneCount = variants.filter(Boolean).length;
  const ready = doneCount === DIRECTIONS.length && selected >= 0;

  const persistSelection = async (i: number) => {
    onSelected(i);
    if (!projectId) return;
    try {
      await fetch(`/api/studio/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected: i,
          variants: variants.filter(Boolean),
        }),
      });
    } catch {
      /* la sélection reste valide côté interface */
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Trois lectures du même modèle — cliquez sur celle que vous retenez.
        </p>
        <Badge
          variant="outline"
          className="ml-auto gap-1 rounded-full border-border/80 bg-background font-normal"
        >
          <Loader2
            className={cn(
              "size-3 text-primary",
              doneCount < 3 && "animate-spin"
            )}
          />
          {doneCount}/3 prêtes
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {DIRECTIONS.map((dir, i) => {
          const v = variants[i];
          const st = status[i];
          const isSel = selected === i;
          return (
            <VariantCard
              key={dir.label}
              dir={dir}
              index={i}
              variant={v}
              status={st}
              selected={isSel}
              onSelect={() => void persistSelection(i)}
              onRegenerate={() => {
                onVariants((prev) => {
                  const n = [...prev];
                  n[i] = null;
                  return n;
                });
                void generate(i, Date.now().toString(36));
              }}
            />
          );
        })}
      </div>

      <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex flex-col gap-2">
        <Button
          onClick={onContinue}
          disabled={!ready}
          size="lg"
          className="h-13 w-full rounded-full text-[15px] font-bold shadow-lg"
        >
          <Check className="size-4" />
          Valider et établir le patron
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {selected < 0
            ? "Sélectionnez d'abord une variante."
            : doneCount < 3
              ? "Vous pouvez valider dès maintenant — les autres propositions continuent en arrière-plan."
              : "Le patron sera calculé sur vos mesures, dans le style de cette variante."}
        </p>
      </div>
    </div>
  );
}

/* Carte d'une variante (interne) ------------------------------------ */

function VariantCard({
  dir,
  index,
  variant,
  status,
  selected,
  onSelect,
  onRegenerate,
}: {
  dir: (typeof DIRECTIONS)[number];
  index: number;
  variant: StudioVariant | null;
  status: DirStatus;
  selected: boolean;
  onSelect: () => void;
  onRegenerate: () => void;
}) {
  return (
    <article
      className={cn(
        "card-luxe group overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        selected
          ? "border-primary shadow-lg ring-2 ring-primary/40"
          : "border-border/70 hover:-translate-y-1 hover:border-primary/40"
      )}
    >
      <button
        onClick={onSelect}
        disabled={!variant}
        aria-pressed={selected}
        aria-label={`Sélectionner la variante ${dir.label}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-accent/40 outline-none ring-primary/50 focus-visible:ring-2"
      >
        {variant ? (
          <>
            { }
            <img
              src={variant.url}
              alt={`Variante IA : ${dir.label}`}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/85 px-2.5 text-[10px] font-semibold text-foreground backdrop-blur">
              <Sparkles className="size-3 text-primary" />
              Proposé par l&apos;IA
            </Badge>
            {selected && (
              <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Check className="size-4" />
              </span>
            )}
          </>
        ) : status === "error" ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <TriangleAlert className="size-6 text-destructive" />
              <p className="text-xs font-semibold">Génération impossible</p>
              <span className="text-[11px] font-semibold text-primary underline underline-offset-2">
                Réessayer ci-dessous
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-accent/70 via-background to-accent/40" />
            <div className="relative z-10 flex flex-col items-center gap-2.5 px-6 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-background shadow-sm">
                <Loader2 className="size-4 animate-spin text-primary" />
              </span>
              <p className="text-xs font-semibold">L&apos;IA habille le mannequin…</p>
              <p className="text-[11px] text-muted-foreground">20 à 60 s</p>
            </div>
          </div>
        )}
      </button>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-lg italic text-primary/90">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-display text-[15px] font-bold">{dir.label}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={status === "loading"}
            className="ml-auto size-8 rounded-full p-0"
            aria-label={`Régénérer la variante ${dir.label}`}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {dir.desc}
        </p>
      </div>
    </article>
  );
}
