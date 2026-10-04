import {
  ArrowRight,
  BadgeCheck,
  Info,
  ListOrdered,
  Plus,
  Scissors,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GarmentPreview } from "@/components/atelier/garment-preview";
import { PieceMini } from "@/components/atelier/pieces";
import { ASM, MODELS } from "@/lib/atelier/patterns";
import type {
  AsmStep,
  Measures,
  ModelKey,
  PieceDef,
} from "@/lib/atelier/patterns";
import { cn } from "@/lib/utils";

/**
 * Guide d'assemblage façon affiche pédagogique : « De la pièce de tissu au
 * vêtement fini ». Les pièces du patronage sont numérotées, chaque étape
 * d'assemblage est présentée en carte (pièces + flèche → résultat), et un
 * récapitulatif global résume la formule complète. Entièrement dynamique :
 * s'adapte aux 17 modèles et aux mesures de l'utilisateur.
 */

/* Couleurs des pastilles numérotées (palette affiche, distinctes) */
const NUM_COLORS = [
  "#db2777",
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#65a30d",
];
const colorOf = (i: number) => NUM_COLORS[i % NUM_COLORS.length];

const parseRef = (ref: string) => {
  const m = ref.match(/^(.*?)\s*·\s*(\d+)$/);
  return m ? { base: m[1], occ: Number(m[2]) } : { base: ref, occ: 0 };
};

const defFor = (defs: PieceDef[], base: string) =>
  defs.find((d) => d.n === base) ??
  defs.find((d) => d.n.startsWith(base) || base.startsWith(d.n)) ??
  defs[0];

function stepTitle(s: AsmStep): string {
  const all = `${s[0]} ${s[4] ?? ""}`.toLowerCase();
  if (s[2] && s[3]) {
    if (/ceinture/.test(all)) return "Poser la ceinture";
    if (/\bcol\b/.test(all)) return "Assembler le col";
    if (/manche/.test(all)) return "Poser les manches";
    if (/poche/.test(all)) return "Poser les poches";
    if (/doublur/.test(all)) return "Monter la doublure";
    if (/boutonni/.test(all)) return "Poser les boutonnières";
    if (/pate/.test(all)) return "Préparer les pattes";
    return "Assembler les pièces";
  }
  if (/pince/.test(all)) return "Piquer les pinces";
  if (/plis/.test(all)) return "Marquer les plis";
  if (/ourlet/.test(all)) return "Faire l'ourlet";
  if (/fermeture/.test(all)) return "Poser la fermeture";
  if (/bouton/.test(all)) return "Poser les boutons";
  if (/fente/.test(all)) return "Finir la fente";
  if (/surpiqu/.test(all)) return "Surpiquer";
  if (/repass/.test(all)) return "Repasser";
  return "Préparation";
}

function seamType(s: AsmStep): string {
  const t = `${s[0]} ${s[4] ?? ""}`.toLowerCase();
  if (s[2]) return /ceinture/.test(t) ? "Ceinture" : "Assemblage";
  if (/pince/.test(t)) return "Pince";
  if (/plis/.test(t)) return "Plis";
  if (/fermez|côtés|milieu dos/.test(t)) return "Montage";
  if (/ourlet|roulott/.test(t)) return "Ourlet";
  if (/surpiqu|goutti|fermeture|fente/.test(t)) return "Finitions";
  return "Préparation";
}

function seamValue(s: AsmStep): string {
  const m = `${s[4] ?? ""} ${s[0]}`.match(/(\d+(?:[.,]\d+)?)\s*cm/);
  return m ? `${m[1].replace(".", ",")} cm` : "1 cm";
}

/* Pastille numérotée d'une pièce */
export function NumBadge({
  n,
  className,
}: {
  n: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold leading-none text-white shadow-sm",
        className,
      )}
      style={{ backgroundColor: colorOf(n - 1) }}
      aria-label={`Pièce ${n}`}
    >
      {n}
    </span>
  );
}

/* Mini pièce avec pastille numérotée par-dessus */
export function NumPiece({
  def,
  num,
  fc,
  sa,
  size = "h-14",
}: {
  def: PieceDef;
  num: number;
  fc: string;
  sa: number;
  size?: string;
}) {
  return (
    <div className="relative shrink-0" title={def.n}>
      <PieceMini p={def} fc={fc} sa={sa} className={cn(size, "w-auto")} />
      <NumBadge
        n={num}
        className="absolute -left-1.5 -top-1.5 size-[18px] text-[9.5px]"
      />
    </div>
  );
}

/* Étiquette de sous-ensemble A, B, C… (cohérente avec l'atelier) */
function SubChip({ letter }: { letter: string }) {
  return (
    <span
      aria-label={`Sous-ensemble ${letter}`}
      className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-bold leading-none text-primary-foreground shadow-sm"
    >
      {letter}
    </span>
  );
}

export function AssemblyGuide({
  modelKey,
  mm,
  defs,
  fc,
  sa,
}: {
  modelKey: ModelKey;
  mm: Measures;
  defs: PieceDef[];
  fc: string;
  sa: number;
}) {
  const model = MODELS[modelKey];
  const steps = ASM[modelKey];

  /* Métadonnées par étape : type, pièces concernées, lettre de sous-ensemble */
  let joinCount = 0;
  const metas = steps.map((s) => {
    const isJoin = Boolean(s[2] && s[3]);
    const anchor = s[1] ? defFor(defs, parseRef(s[1]).base) : null;
    const mover = s[2] ? defFor(defs, parseRef(s[2]).base) : null;
    const meta = {
      isJoin,
      letter: isJoin ? String.fromCharCode(65 + joinCount++) : null,
      anchor,
      mover,
    };
    return meta;
  });

  const numFor = (d: PieceDef | null) =>
    d ? Math.max(1, defs.findIndex((x) => x.n === d.n) + 1) : 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      {/* En-tête façon affiche */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
            <BadgeCheck className="size-[18px]" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold leading-tight sm:text-xl">
              De la pièce de tissu au vêtement fini
            </h2>
            <p className="text-xs text-muted-foreground">
              Guide d&apos;assemblage des pièces du patronage —{' '}
              {model.n.toLowerCase()}, étape par étape. Même sans expérience en
              couture !
            </p>
          </div>
        </div>
        <Badge className="gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-primary">
          <Plus className="size-3" />
          Des pièces bien ordonnées = votre {model.n.toLowerCase()} !
        </Badge>
      </div>

      {/* Zone 1 : les pièces numérotées + légende + résultat final */}
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <section
          aria-label="Les pièces du patronage"
          className="rounded-xl border border-border/70 bg-background p-4"
        >
          <h3 className="font-display text-[15px] font-bold">
            Les pièces du patronage
          </h3>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Voici toutes les pièces à découper dans le tissu, numérotées pour
            bien les assembler.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-5">
            {defs.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <NumPiece def={d} num={i + 1} fc={fc} sa={sa} size="h-16" />
                <p className="max-w-[72px] truncate text-[10px] font-semibold leading-none text-muted-foreground">
                  {d.n}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-1.5 border-t border-border/60 pt-3 sm:grid-cols-2">
            {defs.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[11.5px]">
                <NumBadge n={i + 1} className="size-[18px] text-[9.5px]" />
                <span className="truncate font-semibold">{d.n}</span>
                <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                  ×{d.q}
                  {d.fold ? " · au pli" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Le résultat final"
          className="flex flex-col rounded-xl border border-border/70 bg-background p-4"
        >
          <h3 className="font-display text-[15px] font-bold">
            Le résultat final
          </h3>
          <div className="mt-3 flex flex-1 items-center justify-center rounded-lg bg-accent/30 p-2">
            <GarmentPreview
              m={mm}
              modelKey={modelKey}
              fc={fc}
              className="h-36 w-full"
              label="Vêtement fini"
            />
          </div>
          <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
            Vos pièces réunies avec soin — simple, clair, étape par étape.
          </p>
        </section>
      </div>

      {/* Zone 2 : les étapes numérotées */}
      <section aria-label="Guide d'assemblage pas à pas">
        <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <ListOrdered />
          Le pas-à-pas — {steps.length + 1} étapes
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map((s, i) => {
            const meta = metas[i];
            const numA = numFor(meta.anchor);
            const numB = numFor(meta.mover);
            return (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-border/70 bg-background p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold leading-none text-white shadow-sm"
                    style={{ backgroundColor: colorOf(i) }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold leading-tight">
                      {stepTitle(s)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {meta.isJoin
                        ? `Pièces ${numA} + ${numB} · ${meta.anchor?.n}${
                            meta.mover ? ` + ${meta.mover.n}` : ""
                          }`
                        : `Préparation · Pièce ${numA} · ${meta.anchor?.n ?? ""}`}
                    </p>
                  </div>
                  {meta.letter && <SubChip letter={meta.letter} />}
                </div>

                <div className="mt-3 flex min-h-[68px] items-center gap-2 rounded-lg bg-accent/25 px-3 py-2">
                  {meta.anchor && (
                    <NumPiece
                      def={meta.anchor}
                      num={numA}
                      fc={fc}
                      sa={sa}
                      size="h-12"
                    />
                  )}
                  {meta.mover && (
                    <>
                      <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                      <NumPiece
                        def={meta.mover}
                        num={numB}
                        fc={fc}
                        sa={sa}
                        size="h-12"
                      />
                    </>
                  )}
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                  {meta.letter ? (
                    <SubChip letter={meta.letter} />
                  ) : (
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <Scissors className="size-3.5" />
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  {s[0]}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-2.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/80 bg-card px-2 py-0.5 text-[10px] font-normal"
                  >
                    {seamType(s)}
                  </Badge>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground">
                    {seamValue(s)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Carte finale : le résultat */}
          <div className="flex flex-col rounded-xl border border-primary/40 bg-primary/5 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold leading-none text-primary shadow-sm">
                {steps.length + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold leading-tight">
                  Résultat final
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Toutes les pièces réunies
                </p>
              </div>
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-primary">
                <Sparkles className="size-3.5" />
              </span>
            </div>
            <div className="mt-3 flex min-h-[68px] items-center justify-center rounded-lg bg-accent/30 px-3 py-2">
              <GarmentPreview
                m={mm}
                modelKey={modelKey}
                fc={fc}
                className="h-24 w-full"
                label="Vêtement terminé"
              />
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Et voilà — votre {model.n.toLowerCase()} ! Simple, clair, étape
              par étape.
            </p>
            <div className="mt-auto flex items-center gap-2 pt-2.5">
              <Badge className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">
                Votre vêtement !
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 3 : récapitulatif global */}
      <section
        aria-label="Récapitulatif de l'assemblage global"
        className="rounded-xl border border-border/70 bg-background p-4"
      >
        <h3 className="font-display text-[15px] font-bold">
          Récapitulatif de l&apos;assemblage global
        </h3>
        <div className="mt-3 flex items-center gap-2.5 overflow-x-auto pb-1">
          {metas.map((meta, i) =>
            meta.isJoin ? (
              <div
                key={i}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent/25 px-2.5 py-1.5"
              >
                {meta.anchor && (
                  <NumPiece
                    def={meta.anchor}
                    num={numFor(meta.anchor)}
                    fc={fc}
                    sa={sa}
                    size="h-9"
                  />
                )}
                {meta.mover && (
                  <>
                    <Plus className="size-3 text-muted-foreground" />
                    <NumPiece
                      def={meta.mover}
                      num={numFor(meta.mover)}
                      fc={fc}
                      sa={sa}
                      size="h-9"
                    />
                  </>
                )}
                <ArrowRight className="size-3 text-primary" />
                <SubChip letter={meta.letter ?? "A"} />
              </div>
            ) : null,
          )}
          <ArrowRight className="size-4 shrink-0 text-primary" />
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5">
            <GarmentPreview
              m={mm}
              modelKey={modelKey}
              fc={fc}
              className="h-10 w-9"
              label="Vêtement fini"
            />
            <span className="text-[12px] font-bold leading-tight text-primary">
              Votre {model.n.toLowerCase()} !
            </span>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Pas besoin d&apos;être couturier : suivez les pièces numérotées,
          assemblez-les dans l&apos;ordre et prenez votre temps — une couture
          à la fois.
        </p>
      </section>
    </div>
  );
}
