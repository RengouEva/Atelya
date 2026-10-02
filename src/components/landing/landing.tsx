"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  GitMerge,
  Images,
  Layers,
  Ruler,
  Scissors,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function Nav({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpen}
          className="flex items-center gap-2.5 rounded-xl outline-none ring-primary/50 transition hover:opacity-85 focus-visible:ring-2"
          aria-label="Ouvrir le studio"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white shadow-sm">
            <Scissors className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-bold">
              Studio de coupe
            </span>
            <span className="block text-[11px] tracking-wide text-muted-foreground">
              photo · IA · patronage
            </span>
          </span>
        </button>

        <nav
          className="ml-8 hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex"
          aria-label="Navigation principale"
        >
          <a href="#methode" className="transition hover:text-foreground">
            Méthode
          </a>
          <a href="#exemples" className="transition hover:text-foreground">
            Exemples
          </a>
          <a href="#savoir-faire" className="transition hover:text-foreground">
            Savoir-faire
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={onOpen} className="rounded-full pl-4 pr-3 shadow-sm">
            Ouvrir le studio
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

const HERO_VARIANTS = [
  { src: "/ai/ex-longue.png", label: "Longue & fluide" },
  { src: "/ai/ex-courte.png", label: "Courte & moderne" },
  { src: "/ai/ex-raffinee.png", label: "Détaillée & raffinée" },
];

function Hero({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 size-[540px] rounded-full bg-gradient-to-br from-primary/15 via-[#F0703F]/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:pb-24 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            Nouveau — studio piloté par IA
          </Badge>
          <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] sm:text-6xl">
            D&apos;une photo,{" "}
            <span className="font-editorial italic text-primary">
              trois vêtements.
            </span>
            <br />
            Du patron à l&apos;aiguille.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Le styliste modéliste dépose la photo de son modèle. L&apos;IA
            propose trois variantes habillées sur mannequin, établit toutes les
            pièces du patron, les place sur le tissu avec le métrage exact —
            puis guide l&apos;assemblage, couture par couture.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              onClick={onOpen}
              size="lg"
              className="h-12 rounded-full px-7 text-[15px] shadow-lg"
            >
              <Camera className="size-4" />
              Publier une photo
            </Button>
            <a
              href="#methode"
              className="rounded-full border border-border/80 bg-background px-6 py-3 text-sm font-medium outline-none ring-primary/50 transition hover:bg-accent focus-visible:ring-2"
            >
              Voir la méthode
            </a>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border/60 pt-6">
            {[
              ["1", "photo suffit"],
              ["3", "variantes IA sur mannequin"],
              ["4", "étapes jusqu'au vêtement fini"],
            ].map(([n, d]) => (
              <div key={d}>
                <dt className="font-display text-3xl font-bold text-primary">{n}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Maquette : 1 photo → 3 variantes */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
          className="relative"
          aria-hidden="true"
        >
          <div className="card-luxe rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-xl">
            <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] gap-4 sm:grid-cols-[170px_1fr]">
              <figure className="overflow-hidden rounded-xl border border-border/60">
                <div className="relative aspect-[3/4]">
                  { }
                  <img
                    src="/ai/robe-ia.png"
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                  <Badge className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-semibold text-foreground backdrop-blur">
                    Photo du modèle
                  </Badge>
                </div>
              </figure>
              <div className="grid grid-cols-3 gap-2.5">
                {HERO_VARIANTS.map((v, i) => (
                  <motion.figure
                    key={v.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.4 + i * 0.15 }}
                    className="relative overflow-hidden rounded-lg border border-border/60"
                  >
                    <div className="aspect-[3/4]">
                      { }
                      <img
                        src={v.src}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 text-[9px] font-semibold leading-tight text-white">
                      {v.label}
                    </figcaption>
                    <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">
                      IA
                    </span>
                  </motion.figure>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center font-editorial text-sm italic text-muted-foreground">
              Une photo d&apos;entrée, trois propositions habillées sur
              mannequin — choisissez, l&apos;atelier prend le relais.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bandeau défilant                                                    */
/* ------------------------------------------------------------------ */

const MARQUEE_ITEMS = [
  "Photo du modèle",
  "3 variantes IA",
  "Mannequin de couturier",
  "Patron sur mesures",
  "Plan de placement",
  "Métrage exact",
  "Assemblage guidé",
  "Vêtement fini",
];

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="overflow-hidden border-y border-border/60 bg-card/40 py-3.5"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee gap-10">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            {t}
            <Sparkles className="size-3.5 text-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Méthode                                                             */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: Camera,
    t: "Publiez la photo",
    d: "Croquis, photo magazine ou pièce existante : choisissez la famille du vêtement et entrez les mesures de la cliente.",
  },
  {
    icon: Images,
    t: "Trois variantes sur mannequin",
    d: "L'IA réinterprète votre modèle en trois directions — longue et fluide, courte et moderne, détaillée et raffinée — portées sur mannequin de couturier.",
  },
  {
    icon: Scissors,
    t: "La découpe complète",
    d: "Le patron se dessine pièce par pièce sur vos mesures : nomenclature, marges, pli et droit-fil, plan de placement optimisé et métrage au centimètre.",
  },
  {
    icon: GitMerge,
    t: "L'assemblage guidé",
    d: "Les pièces se rejoignent bord à bord, coutures numérotées dans l'ordre exact — la dernière scène révèle le vêtement fini sur mannequin.",
  },
];

function Methode() {
  return (
    <section id="methode" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <motion.div {...reveal} className="max-w-2xl">
        <p className="font-editorial text-lg italic text-primary">La méthode</p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Quatre gestes, du croquis au vêtement
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Le studio enchaîne les étapes d&apos;un vrai bureau d&apos;études de
          couture — avec l&apos;IA comme première d&apos;atelier.
        </p>
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
            <s.icon className="mt-3 size-5 text-primary" />
            <h3 className="mt-2 font-display text-lg font-bold">{s.t}</h3>
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
/* Exemples générés                                                    */
/* ------------------------------------------------------------------ */

const EXAMPLES = [
  {
    src: "/ai/ex-longue.png",
    t: "Longue & fluide",
    d: "Le modèle d'origine s'allonge en version soirée : tombé souple, allure couture.",
  },
  {
    src: "/ai/ex-courte.png",
    t: "Courte & moderne",
    d: "Version raccourcie aux lignes nettes, pensée pour le quotidien.",
  },
  {
    src: "/ai/ex-raffinee.png",
    t: "Détaillée & raffinée",
    d: "Poches plaquées, ceinture contrastée, surpiqûres décoratives : la version précieuse.",
  },
];

function Exemples() {
  return (
    <section id="exemples" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <motion.div {...reveal}>
            <p className="font-editorial text-lg italic text-primary">
              Exemple réel
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Trois déclinaisons d&apos;une même photo
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Ci-dessous, trois propositions générées par l&apos;IA à partir
              d&apos;une seule photo de départ — même tissu, même identité,
              trois partis pris. Dans le studio, ce sont vos photos qui parlent.
            </p>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="rounded-2xl border border-border/70 bg-background p-4 text-[13px] leading-relaxed text-muted-foreground"
          >
            <p className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Sparkles className="size-4 text-primary" />
              Tout se passe dans le studio
            </p>
            <p className="mt-1.5">
              Variantes régénérables à volonté, patron calculé sur vos mesures
              dès la validation, visuel des pièces en situation sur la table de
              coupe.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {EXAMPLES.map((s, i) => (
            <motion.figure
              key={s.t}
              {...reveal}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                { }
                <img
                  src={s.src}
                  alt={`${s.t} — variante générée par IA`}
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
/* Savoir-faire                                                        */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Images,
    t: "Variantes IA sur mannequin",
    d: "Chaque proposition est une vraie photographie : vêtement fini, bien habillé, présenté sur mannequin de couturier.",
  },
  {
    icon: Layers,
    t: "Patron calculé sur mesures",
    d: "Poitrine, taille, hanches, longueur : les pièces naissent paramétriques — devant, dos, manches, ceinture, tout est tracé.",
  },
  {
    icon: Ruler,
    t: "Placement & métrage exacts",
    d: "Les pièces se rangent sur votre laize avec leurs marges : le métrage s'affiche au centimètre, avec alerte si le tissu est trop étroit.",
  },
  {
    icon: Scissors,
    t: "Coupe animée",
    d: "Touchez une pièce sur le plan de coupe : les ciseaux tracent son contour. Le tissu se vide au rythme de votre table.",
  },
  {
    icon: GitMerge,
    t: "Assemblage bord à bord",
    d: "Chaque couture est numérotée, les bords à réunir sont nommés — l'ordre du montage n'a plus de secret.",
  },
  {
    icon: Sparkles,
    t: "Visuels IA en situation",
    d: "Sur demande, l'IA photographie les pièces du patron épinglées sur le tissu — l'atelier avant l'atelier.",
  },
];

function SavoirFaire() {
  return (
    <section id="savoir-faire" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <motion.div {...reveal} className="max-w-2xl">
        <p className="font-editorial text-lg italic text-primary">
          Le savoir-faire
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Un bureau d&apos;études complet, piloté par la photo
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          L&apos;IA propose et met en scène ; le moteur de patronage calcule,
          place et chiffre. Vous gardez la main sur chaque décision.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.t}
            {...reveal}
            transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: "easeOut" }}
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
/* Appel final + pied de page                                          */
/* ------------------------------------------------------------------ */

function FinalCta({ onOpen }: { onOpen: () => void }) {
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
          La prochaine collection commence par une image
        </p>
        <h2 className="relative mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
          Publiez une photo,
          <br className="hidden sm:block" /> laissez venir les variantes.
        </h2>
        <div className="relative mt-8 flex justify-center">
          <Button
            onClick={onOpen}
            size="lg"
            className="h-12 rounded-full bg-primary px-8 text-[15px] text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Camera className="size-4" />
            Ouvrir le studio
          </Button>
        </div>
        <p className="relative mt-4 text-[12px] opacity-70">
          Gratuit · sans compte · projets et variantes conservés en base
        </p>
      </motion.div>
    </section>
  );
}

function Footer({ onOpen }: { onOpen: () => void }) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white">
            <Scissors className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold">
              Studio de coupe
            </span>
            <span className="block text-[11px] text-muted-foreground">
              de la photo au vêtement fini
            </span>
          </span>
        </div>
        <nav
          className="flex items-center gap-5 text-sm text-muted-foreground"
          aria-label="Pied de page"
        >
          <a href="#methode" className="transition hover:text-foreground">
            Méthode
          </a>
          <a href="#exemples" className="transition hover:text-foreground">
            Exemples
          </a>
          <button onClick={onOpen} className="transition hover:text-foreground">
            Ouvrir le studio
          </button>
        </nav>
        <p className="text-[11px] text-muted-foreground">
          Propulsé par IA — patronage paramétrique & images génératives.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Landing complète                                                    */
/* ------------------------------------------------------------------ */

export function Landing({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav onOpen={onOpen} />
      <main className="flex-1">
        <Hero onOpen={onOpen} />
        <Marquee />
        <Methode />
        <Exemples />
        <SavoirFaire />
        <FinalCta onOpen={onOpen} />
      </main>
      <Footer onOpen={onOpen} />
    </div>
  );
}
