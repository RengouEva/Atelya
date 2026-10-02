"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  DraftingCompass,
  Eye,
  GitMerge,
  LayoutGrid,
  Ruler,
  Scissors,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GarmentPreview } from "@/components/atelier/garment-preview";
import { FABRIC_PRESETS } from "@/components/atelier/measures-card";
import {
  CATS,
  CAT_ORDER,
  MODELS,
  type ModelKey,
  type PieceDef,
} from "@/lib/atelier/patterns";
import { previewMeasures } from "@/lib/atelier/preview";

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const MODEL_KEYS = Object.keys(MODELS) as ModelKey[];

/* ------------------------------------------------------------------ */
/* Petit patron « papier » flottant (décor du héros)                   */
/* ------------------------------------------------------------------ */

function PaperPiece({
  p,
  className,
  style,
}: {
  p: PieceDef;
  className?: string;
  style?: React.CSSProperties;
}) {
  const m = 3;
  const sw = Math.max(p.w, p.h) / 90;
  return (
    <svg
      viewBox={`${-m} ${-m} ${p.w + m * 2} ${p.h + m * 2}`}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d={p.d}
        fillRule={p.eo ? "evenodd" : undefined}
        fill="var(--card)"
        stroke="var(--foreground)"
        strokeOpacity=".55"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path
        d={p.d}
        fillRule={p.eo ? "evenodd" : undefined}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={sw / 1.5}
        strokeDasharray="3 2"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function Nav({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => onOpen()}
          className="flex items-center gap-2.5 rounded-xl outline-none ring-primary/50 transition hover:opacity-85 focus-visible:ring-2"
          aria-label="Ouvrir l'atelier"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white shadow-sm">
            <Scissors className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-bold">
              Atelier
            </span>
            <span className="block text-[11px] tracking-wide text-muted-foreground">
              coupe du tissu · sur mesure
            </span>
          </span>
        </button>

        <nav
          className="ml-8 hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex"
          aria-label="Navigation principale"
        >
          <a href="#modeles" className="transition hover:text-foreground">
            Modèles
          </a>
          <a href="#savoir-faire" className="transition hover:text-foreground">
            Savoir-faire
          </a>
          <a href="#ia" className="transition hover:text-foreground">
            Visuels IA
          </a>
          <a href="#fonctionnement" className="transition hover:text-foreground">
            Fonctionnement
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={() => onOpen()}
            className="rounded-full pl-4 pr-3 shadow-sm"
          >
            Ouvrir l'atelier
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Héros                                                               */
/* ------------------------------------------------------------------ */

function Hero({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  const heroPieces = React.useMemo(
    () => MODELS.droite.g(previewMeasures("droite")),
    []
  );
  const cerclePiece = React.useMemo(
    () => MODELS.cercle.g(previewMeasures("cercle"))[0],
    []
  );

  return (
    <section className="relative overflow-hidden">
      <div
        className="hero-grain pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 right-0 size-[520px] rounded-full bg-[#D6336C]/10 blur-3xl dark:bg-[#D6336C]/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 size-[420px] rounded-full bg-[#2A9DB5]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        {/* Texte */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            Studio de patronage — vos mesures, vos vêtements
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl"
          >
            De la mesure au vêtement,{" "}
            <span className="font-editorial font-medium italic text-primary">
              la coupe devient un art précis.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            Entrez quatre mesures : l'atelier dessine le patron pièce par
            pièce, place le plan de coupe sur votre laize, calcule le métrage,
            puis vous guide couture par couture jusqu'au vêtement porté —
            aperçu sur mannequin à l'appui.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Button
              onClick={() => onOpen()}
              size="lg"
              className="h-12 rounded-full px-6 text-[15px] shadow-md"
            >
              <Scissors className="size-4" />
              Ouvrir l'atelier
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full px-6 text-[15px]"
            >
              <a href="#modeles">
                Explorer les {MODEL_KEYS.length} modèles
              </a>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border/60 pt-6"
          >
            {[
              [`${MODEL_KEYS.length}`, "patrons paramétriques"],
              ["4", "mesures suffisent"],
              ["1", "seul outil, du tracé au porté"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">
                  {v}
                </dd>
                <dd className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                  {l}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Visuel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[460px]"
        >
          <div className="card-luxe relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground"
              >
                Aperçu calculé sur mesures
              </Badge>
              <span className="font-editorial text-lg italic text-muted-foreground">
                robe trapèze
              </span>
            </div>
            <div className="mt-2 rounded-2xl bg-gradient-to-b from-accent/70 via-background to-background p-4">
              <GarmentPreview
                m={previewMeasures("robe")}
                modelKey="robe"
                fc="#C25E6E"
                className="mx-auto h-[340px] w-auto max-w-full sm:h-[380px]"
                label="Aperçu d'une robe trapèze"
              />
            </div>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Silhouette générée d'après P · T · H · L — elle change avec
              chaque saisie
            </p>
          </div>

          {/* patrons papier flottants */}
          <motion.div
            className="absolute -left-8 top-16 w-24 sm:w-28"
            animate={{ y: [0, -12, 0], rotate: [-6, -3, -6] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <PaperPiece p={heroPieces[0]} className="drop-shadow-md" />
            <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              patron A
            </p>
          </motion.div>
          <motion.div
            className="absolute -right-6 bottom-14 w-24 sm:w-28"
            animate={{ y: [0, 10, 0], rotate: [5, 8, 5] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
            aria-hidden="true"
          >
            <PaperPiece p={cerclePiece} className="drop-shadow-md" />
            <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              patron B
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bandeau défilant                                                    */
/* ------------------------------------------------------------------ */

function Marquee() {
  const items = MODEL_KEYS.map((k) => MODELS[k].n);
  const row = [...items, ...items];
  return (
    <div
      className="overflow-hidden border-y border-border/60 bg-card/60 py-3.5"
      aria-hidden="true"
    >
      <div className="animate-marquee flex w-max items-center gap-8">
        {row.map((n, i) => (
          <span
            key={i}
            className="flex items-center gap-8 whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            {n}
            <span className="text-primary">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Savoir-faire                                                        */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Ruler,
    t: "Mesures vivantes",
    d: "Poitrine, taille, hanches, longueur : le patron entier se redessine à chaque saisie, sans recompiler quoi que ce soit.",
  },
  {
    icon: DraftingCompass,
    t: "Patron généré pièce par pièce",
    d: "Pièces nommées A · B · C, pli et miroir matérialisés, droit-fil fléché, marges de couture paramétrables.",
  },
  {
    icon: LayoutGrid,
    t: "Plan de coupe & métrage",
    d: "Placement optimisé sur votre laize, métrage au centimètre, alerte si le tissu est trop étroit.",
  },
  {
    icon: Scissors,
    t: "Coupe guidée animée",
    d: "Touchez une pièce : les ciseaux tracent le contour en direct. Le plan se vide au rythme de votre table de coupe.",
  },
  {
    icon: GitMerge,
    t: "Montage couture par couture",
    d: "Les pièces réelles se rejoignent bord à bord, coutures numérotées dans l'ordre exact du montage.",
  },
  {
    icon: Eye,
    t: "Produit fini sur mannequin",
    d: "Chaque montage se termine sur le vêtement porté : silhouette posée sur le buste, à vos mesures.",
  },
];

function SavoirFaire() {
  return (
    <section
      id="savoir-faire"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24"
    >
      <motion.div {...reveal} className="max-w-2xl">
        <p className="font-editorial text-lg italic text-primary">
          Le savoir-faire
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Tout l'atelier dans une application
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Du métrage de tissu au dernier ourlet, chaque étape de la confection
          est visualisée, chiffrée et guidée — sans jargon, sans détour.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.t}
            {...reveal}
            transition={{
              duration: 0.5,
              delay: (i % 3) * 0.07,
              ease: "easeOut",
            }}
            className="card-luxe group rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-accent text-primary transition-transform duration-300 group-hover:scale-110">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{f.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {f.d}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue des modèles                                               */
/* ------------------------------------------------------------------ */

function Catalogue({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  const [cat, setCat] = React.useState<string>("tous");
  const shown = MODEL_KEYS.filter(
    (k) => cat === "tous" || MODELS[k].cat === cat
  );

  return (
    <section id="modeles" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          {...reveal}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div className="max-w-2xl">
            <p className="font-editorial text-lg italic text-primary">
              La collection
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {MODEL_KEYS.length} modèles, une seule méthode
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Chaque patron est calculé sur vos mesures et livré avec son plan
              de coupe, sa méthode de pliage et son montage guidé. Choisissez
              un modèle : l'atelier s'ouvre directement dessus.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrer par famille"
          >
            {["tous", ...CAT_ORDER].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {c === "tous" ? "Tous" : CATS[c as keyof typeof CATS]}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((k, i) => {
            const m = MODELS[k];
            const fc = FABRIC_PRESETS[i % FABRIC_PRESETS.length];
            const pieces = m
              .g(previewMeasures(k))
              .reduce((a, p) => a + p.q, 0);
            return (
              <motion.button
                key={k}
                {...reveal}
                transition={{
                  duration: 0.45,
                  delay: (i % 4) * 0.05,
                  ease: "easeOut",
                }}
                onClick={() => onOpen(k)}
                className="card-luxe group flex flex-col rounded-2xl border border-border/70 bg-card p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Ouvrir le modèle ${m.n} dans l'atelier`}
              >
                <div className="rounded-xl bg-gradient-to-b from-secondary/60 to-background p-2">
                  <GarmentPreview
                    m={previewMeasures(k)}
                    modelKey={k}
                    fc={fc}
                    className="mx-auto h-44 w-auto max-w-full"
                    label={`Aperçu : ${m.n}`}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="font-display text-[15px] font-bold leading-tight">
                    {m.n}
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-auto shrink-0 rounded-full border-border/80 px-2 text-[10px] font-medium text-muted-foreground"
                  >
                    {CATS[m.cat]}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                  {m.desc}
                </p>
                <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">{pieces} pièces</span>
                  <span className="flex items-center gap-1">
                    {[1, 2, 3].map((d) => (
                      <span
                        key={d}
                        className={`size-1.5 rounded-full ${
                          d <= m.diff ? "bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Couper
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fonctionnement                                                      */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    t: "Prenez les mesures",
    d: "Quatre chiffres au mètre ruban : poitrine, taille, hanches, longueur du vêtement.",
  },
  {
    t: "Le patron se dessine",
    d: "Pièces générées en direct, aperçu du vêtement à côté — vous voyez immédiatement le style obtenu.",
  },
  {
    t: "Coupez sans stress",
    d: "Plan de coupe optimisé sur la laize, métrage exact, découpe animée pièce par pièce.",
  },
  {
    t: "Assemblez, portez",
    d: "Coutures numérotées bord à bord, dans l'ordre — la dernière carte révèle le vêtement sur mannequin.",
  },
];

function Fonctionnement() {
  return (
    <section
      id="fonctionnement"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24"
    >
      <motion.div {...reveal} className="max-w-2xl">
        <p className="font-editorial text-lg italic text-primary">
          La méthode
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Quatre étapes, zéro approximation
        </h2>
      </motion.div>

      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.t}
            {...reveal}
            transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            className="relative rounded-2xl border border-border/70 bg-card p-6"
          >
            <span className="font-editorial text-4xl font-medium italic text-primary/90">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-lg font-bold">{s.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {s.d}
            </p>
            {i < STEPS.length - 1 && (
              <span
                className="absolute -right-3 top-1/2 hidden h-px w-6 border-t border-dashed border-primary/50 lg:block"
                aria-hidden="true"
              />
            )}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels IA                                                          */
/* ------------------------------------------------------------------ */

const AI_SHOTS = [
  {
    src: "/ai/robe-ia.png",
    t: "Le produit fini",
    d: "Le vêtement terminé, porté sur un mannequin de couturier — généré depuis le modèle et vos mesures.",
  },
  {
    src: "/ai/tissu-ia.png",
    t: "La matière",
    d: "Gros plan sur la texture du tissu conseillé, dans le coloris exact choisi au sélecteur.",
  },
  {
    src: "/ai/pieces-ia.png",
    t: "Les pièces en situation",
    d: "Le patron papier épinglé sur le tissu, prêt pour la craie, les épingles et les ciseaux.",
  },
];

function AiSection() {
  return (
    <section
      id="ia"
      className="border-y border-border/60 bg-card/40"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <motion.div {...reveal}>
            <p className="font-editorial text-lg italic text-primary">
              Intelligence artificielle
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              L&apos;IA entre dans l&apos;atelier
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Un clic suffit pour obtenir des photographies réalistes de votre
              projet : le vêtement fini porté sur mannequin, la texture du
              tissu dans votre coloris, les pièces du patron posées sur la
              table de coupe. Chaque image est calculée depuis votre modèle,
              votre tissu et votre couleur — puis conservée en base.
            </p>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="rounded-2xl border border-border/70 bg-background p-4 text-[13px] leading-relaxed text-muted-foreground"
          >
            <p className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Sparkles className="size-4 text-primary" />
              Dans l&apos;atelier, section « Studio IA »
            </p>
            <p className="mt-1.5">
              Trois vues générées à la demande — produit fini, texture,
              pièces — avec variations à volonté. Comptez 20 à 60 secondes par
              image ; les réglages identiques se rechargent instantanément.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {AI_SHOTS.map((s, i) => (
            <motion.figure
              key={s.t}
              {...reveal}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: "easeOut",
              }}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                { }
                <img
                  src={s.src}
                  alt={`${s.t} — visuel généré par IA`}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/85 px-2.5 text-[10px] font-semibold text-foreground backdrop-blur">
                  <Sparkles className="size-3 text-primary" />
                  Généré par IA
                </Badge>
              </div>
              <figcaption className="p-5">
                <h3 className="font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.d}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Appel final + pied de page                                          */
/* ------------------------------------------------------------------ */

function FinalCta({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <motion.div
        {...reveal}
        className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-14 text-center text-background sm:px-12"
      >
        <div
          className="hero-grain pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
        />
        <p className="relative font-editorial text-xl italic opacity-80">
          Le mètre attend ses ordres
        </p>
        <h2 className="relative mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
          Votre prochain vêtement commence
          <br className="hidden sm:block" /> par une mesure.
        </h2>
        <div className="relative mt-8 flex justify-center">
          <Button
            onClick={() => onOpen()}
            size="lg"
            className="h-12 rounded-full bg-primary px-8 text-[15px] text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Scissors className="size-4" />
            Ouvrir l'atelier
          </Button>
        </div>
        <p className="relative mt-4 text-[12px] opacity-70">
          Gratuit · sans compte · fiches clientes conservées en base
        </p>
      </motion.div>
    </section>
  );
}

function Footer({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/60">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white">
              <Scissors className="size-4" />
            </span>
            <span className="font-display text-[16px] font-bold">
              Atelier
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
            Patronage paramétrique, plan de coupe et montage guidé — pensé pour
            les mains minutieuses et les tissus qu'on respecte.
          </p>
        </div>
        <nav className="text-sm" aria-label="Navigation pied de page">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Naviguer
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="#modeles"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Les {MODEL_KEYS.length} modèles
              </a>
            </li>
            <li>
              <a
                href="#savoir-faire"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Savoir-faire
              </a>
            </li>
            <li>
              <a
                href="#fonctionnement"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Fonctionnement
              </a>
            </li>
            <li>
              <button
                onClick={() => onOpen()}
                className="text-muted-foreground transition hover:text-foreground"
              >
                Ouvrir l'atelier
              </button>
            </li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Vos données
          </p>
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
            <Database className="mt-0.5 size-4 shrink-0" />
            Les fiches clientes sont enregistrées dans la base de l'atelier —
            à vous, et personne d'autre.
          </p>
        </div>
      </div>
      <div className="border-t border-border/50 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11.5px] text-muted-foreground">
          © {new Date().getFullYear()} Atelier — coupe du tissu · fait avec
          soin
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Landing complète                                                    */
/* ------------------------------------------------------------------ */

export function Landing({ onOpen }: { onOpen: (k?: ModelKey) => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav onOpen={onOpen} />
      <main className="flex-1">
        <Hero onOpen={onOpen} />
        <Marquee />
        <SavoirFaire />
        <Catalogue onOpen={onOpen} />
        <Fonctionnement />
        <AiSection />
        <FinalCta onOpen={onOpen} />
      </main>
      <Footer onOpen={onOpen} />
    </div>
  );
}
