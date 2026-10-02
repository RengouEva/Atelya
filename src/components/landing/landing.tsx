"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Camera,
  ChevronRight,
  Hand,
  Images,
  Scissors,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const pop = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

/* ------------------------------------------------------------------ */
/* Splash app native — logo central                                    */
/* ------------------------------------------------------------------ */

function Splash({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#f1f4fc] text-[#0a1b4d]">
      {/* Fond clair = couleur de la page atelier : le logo sombre ressort sans encadré */}
      <div className="splash-halo-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Barre haute */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0a1b4d]/55">
          Atelier IA
        </span>
        <ThemeToggle />
      </header>

      {/* Logo central — halo doré discret + anneau de couture rotatif */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <div className="relative grid place-items-center">
          <div
            className="splash-halo-light pointer-events-none absolute size-[min(92vw,440px)] rounded-full"
            aria-hidden="true"
          />
          <motion.svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="pointer-events-none absolute size-[min(98vw,474px)] opacity-50"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, ease: "linear", repeat: Infinity }}
          >
            <circle
              cx="50"
              cy="50"
              r="48.4"
              fill="none"
              stroke="#D9A416"
              strokeWidth="0.55"
              strokeDasharray="2.6 2.2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="1.6" r="1.15" fill="#D9A416" />
          </motion.svg>
          <motion.img
            src="/atelya-logo-splash.webp"
            alt="Atelya — Créez, Mesurez, Réalisez"
            width={665}
            height={487}
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="animate-floaty relative z-10 w-[min(70vw,318px)] drop-shadow-[0_18px_44px_rgba(10,27,77,0.22)]"
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: "easeOut" }}
          className="mt-6 font-display text-2xl font-bold leading-tight text-[#0a1b4d] sm:text-4xl"
        >
          D&apos;une photo,{" "}
          <span className="font-editorial italic text-gold-deep">au vêtement fini.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-2.5 text-sm text-[#0a1b4d]/65 sm:text-[15px]"
        >
          Variantes IA · patron sur mesures · découpe · assemblage
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55, ease: "easeOut" }}
          className="mt-8 flex w-full flex-col items-center gap-3"
        >
          <button
            onClick={onOpen}
            className="group inline-flex h-[52px] w-full max-w-[300px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#F0C243] to-[#E09A12] text-[16px] font-bold text-[#12224e] shadow-[0_12px_34px_-8px_rgba(201,138,10,0.5)] outline-none ring-[#C98A0A]/60 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_16px_40px_-8px_rgba(201,138,10,0.65)] focus-visible:ring-2 active:scale-95"
          >
            <Camera className="size-[18px]" />
            Ouvrir l&apos;atelier
            <ChevronRight className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Workflow mini */}
        <motion.ol
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-10 flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#0a1b4d]/55 sm:gap-x-2.5 sm:text-xs"
        >
          {[
            { icon: Camera, t: "Photo" },
            { icon: Sparkles, t: "Variantes" },
            { icon: Scissors, t: "Découpe" },
            { icon: Hand, t: "Couture" },
          ].map((s, i) => (
            <React.Fragment key={s.t}>
              <li className="flex items-center gap-1.5">
                <s.icon className="size-3.5 text-gold-deep" />
                {s.t}
              </li>
              {i < 3 && <ChevronRight className="size-3 text-[#0a1b4d]/30" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </motion.ol>
      </div>

      {/* Indicateur de défilement */}
      <motion.a
        href="#parcours"
        aria-label="Découvrir le parcours"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="relative z-10 mx-auto mb-[max(1.1rem,env(safe-area-inset-bottom))] grid size-10 place-items-center rounded-full border border-[#0a1b4d]/15 bg-white/70 text-[#0a1b4d]/70 shadow-sm backdrop-blur transition hover:text-[#0a1b4d]"
      >
        <ArrowDown className="size-4 animate-bounce" />
      </motion.a>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Parcours — 4 gestes                                                 */
/* ------------------------------------------------------------------ */

const FLOW = [
  {
    icon: Camera,
    t: "Une photo",
    d: "Le modèle dépose la photo de sa création.",
  },
  {
    icon: Sparkles,
    t: "3 variantes",
    d: "L'IA habille le mannequin de trois interprétations.",
  },
  {
    icon: Scissors,
    t: "La découpe",
    d: "Toutes les pièces du patron, placées sur le tissu.",
  },
  {
    icon: Hand,
    t: "La couture",
    d: "Cousez chaque zone guidée : pièces, sous-ensembles, vêtement fini.",
  },
];

function Parcours() {
  return (
    <section id="parcours" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div {...pop} className="text-center">
          <p className="font-editorial text-lg italic text-gold-deep dark:text-gold">
            Le parcours
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">
            Quatre gestes suffisent
          </h2>
        </motion.div>

        <ol className="snap-row mt-9 flex gap-3.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {FLOW.map((s, i) => (
            <motion.li
              key={s.t}
              {...pop}
              transition={{ duration: 0.45, delay: i * 0.07, ease: "easeOut" }}
              className="card-luxe min-w-[74%] rounded-2xl border border-border/70 bg-card p-5 sm:min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <span className="font-editorial text-2xl font-medium italic text-gold-deep dark:text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3.5 font-display text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{s.d}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exemples — visuels IA                                               */
/* ------------------------------------------------------------------ */

const EXAMPLES = [
  { src: "/ai/ex-longue.png", t: "Longue & fluide" },
  { src: "/ai/ex-courte.png", t: "Courte & moderne" },
  { src: "/ai/ex-raffinee.png", t: "Raffinée" },
];

function Exemples() {
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div {...pop} className="flex items-end justify-between gap-4">
          <div>
            <p className="font-editorial text-lg italic text-gold-deep dark:text-gold">
              Exemples réels
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">
              Trois variantes, une photo
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-foreground sm:flex">
            <Sparkles className="size-3.5 text-gold-deep dark:text-gold" />
            Généré par IA
          </span>
        </motion.div>

        <div className="snap-row mt-8 flex gap-3.5 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {EXAMPLES.map((s, i) => (
            <motion.figure
              key={s.t}
              {...pop}
              transition={{ duration: 0.45, delay: i * 0.07, ease: "easeOut" }}
              className="group relative min-w-[82%] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm md:min-w-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                { }
                <img
                  src={s.src}
                  alt={`${s.t} — variante générée par IA sur mannequin`}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3.5 pt-10">
                  <span className="font-display text-[15px] font-bold text-white">{s.t}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
                    <Sparkles className="size-3 text-[#F0C243]" />
                    Variante IA
                  </span>
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA final + pied de page                                            */
/* ------------------------------------------------------------------ */

function FinalCta({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        {...pop}
        className="splash-navy relative overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:py-16"
      >
        <img
          src="/atelier-bg.webp"
          alt=""
          aria-hidden="true"
          className="splash-atelier pointer-events-none absolute inset-0 size-full object-cover"
        />
        <div className="splash-atelier-shade pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="splash-grain pointer-events-none absolute inset-0" aria-hidden="true" />
        { }
        <img
          src="/atelya-mark-tile.webp"
          alt=""
          aria-hidden="true"
          className="animate-floaty relative z-10 w-[min(46vw,150px)] rounded-[1.9rem] drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
        />
        <h2 className="relative z-10 mt-5 font-display text-2xl font-bold leading-tight sm:text-4xl">
          Votre prochaine pièce commence{" "}
          <span className="text-gold-shine font-editorial italic">par une photo.</span>
        </h2>
        <button
          onClick={onOpen}
          className="relative z-10 mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F0C243] to-[#E09A12] px-8 text-[15px] font-bold text-[#12224e] shadow-[0_12px_34px_-8px_rgba(240,194,67,0.55)] outline-none ring-[#F0C243]/60 transition hover:scale-[1.03] focus-visible:ring-2 active:scale-95"
        >
          <Camera className="size-4" />
          Ouvrir l&apos;atelier
        </button>
      </motion.div>
    </section>
  );
}

function Footer({ onOpen }: { onOpen: () => void }) {
  return (
    <footer className="border-t border-border/60 bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center sm:flex-row sm:justify-between sm:text-left">
        <button onClick={onOpen} className="flex items-center gap-2.5" aria-label="Ouvrir l'atelier">
          { }
          <img src="/atelya-mark-tile.webp" alt="" className="h-10 w-10 rounded-xl shadow-sm" />
          <span className="font-display text-base font-bold">Atelya</span>
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Créez&nbsp;&nbsp;•&nbsp;&nbsp;Mesurez&nbsp;&nbsp;•&nbsp;&nbsp;Réalisez
        </p>
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Atelya — atelier IA
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
      <main className="flex-1">
        <Splash onOpen={onOpen} />
        <Parcours />
        <Exemples />
        <FinalCta onOpen={onOpen} />
      </main>
      <Footer onOpen={onOpen} />
    </div>
  );
}
