"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Hand,
  Layers,
  Pin,
  Puzzle,
  Scissors,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* La méthode réelle en 5 gestes — vraies photos d'atelier (IA)        */
/* du pli de tissu → épingle → coupe → réunion des pièces → couture   */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    src: "/ai/j-plis.png",
    alt: "Tissu bleu roi plié en deux sur la table d'atelier, mètre ruban doré à côté",
    icon: Layers,
    chip: "Plis",
    title: "Plier le tissu",
    desc: "Posez le tissu à plat sur la table, puis pliez-le en deux, endroit contre endroit, en alignant bien les lisières. Lissez chaque pli de la main : les pièces marquées « au pli » sortiront par paire, parfaitement symétriques. Le droit-fil, lui, suit toujours la lisière.",
    tips: ["Plier endroit contre endroit", "Lisières bien alignées", "Le droit-fil suit la lisière"],
  },
  {
    src: "/ai/j-epingle.png",
    alt: "Patron papier épinglé sur le tissu plié avec des épingles acier",
    icon: Pin,
    chip: "Épingler",
    title: "Épingler le patron",
    desc: "Épinglez le patron papier à plat sur le tissu plié, sans le déformer. Plantez les épingles perpendiculairement au bord du patron, tous les 5 cm environ, puis reportez les pinces et les marques de couture à la craie tailleur.",
    tips: ["Épingles perpendiculaires au bord", "Tous les 5 cm environ", "Pinces et marques à la craie"],
  },
  {
    src: "/ai/j-decoupe.png",
    alt: "Ciseaux de tailleur découpant le tissu le long du patron papier",
    icon: Scissors,
    chip: "Découper",
    title: "Découper le long du patron",
    desc: "Coupez le long du contour du patron avec des ciseaux longs et affûtés, sans jamais soulever le tissu : c'est la table qui travaille. Les épingles restent en place pendant la coupe et chaque pièce garde sa marge de couture.",
    tips: ["Ciseaux longs et affûtés", "Le tissu reste posé à plat", "La marge de couture reste solidaire"],
  },
  {
    src: "/ai/j-reunir.png",
    alt: "Petites pièces de tissu coupées rassemblées, étiquette blanche et bobine de fil doré",
    icon: Puzzle,
    chip: "Réunir",
    title: "Réunir les petites pièces",
    desc: "Rassemblez les pièces coupées et accrochez à chacune son étiquette (A, B, C…). Triez-les dans l'ordre du montage : d'abord les petites (ceinture, passants, poches), puis les grandes (devant, dos). Elles attendent ainsi, bien rangées, l'atelier de couture.",
    tips: ["Une étiquette par pièce", "Trier selon l'ordre du montage", "Les chutes servent d'essais de réglage"],
  },
  {
    src: "/ai/j-coudre.png",
    alt: "Machine à coudre assemblant deux pièces de tissu, fil doré, mains guidant le tissu",
    icon: Hand,
    chip: "Coudre",
    title: "Coudre, étape par étape",
    desc: "Devant la machine, prenez la pièce 1 et la pièce 2 : assemblez-les endroit contre endroit, puis ajoutez la pièce 3, et ainsi de suite. C'est exactement le déroulé de l'atelier interactif — et la ceinture se monte en tout dernier.",
    tips: ["Pièce 1 + pièce 2, puis la 3…", "Endroit contre endroit", "La ceinture en tout dernier"],
  },
] as const;

export function FabricJourney() {
  const [idx, setIdx] = React.useState(0);
  const stage = STAGES[idx];
  const Icon = stage.icon;

  /* préchargement des photos pour des transitions sans flash */
  React.useEffect(() => {
    for (const s of STAGES) {
      const img = new Image();
      img.src = s.src;
    }
  }, []);

  const go = (n: number) => setIdx((n + STAGES.length) % STAGES.length);

  return (
    <section
      aria-label="La méthode en 5 gestes, du tissu plié au vêtement cousu"
      className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      <header className="border-b border-border/60 px-5 py-4">
        <h3 className="font-display text-[17px] font-bold leading-tight">
          La méthode en 5 gestes — du tissu plié au vêtement cousu
        </h3>
        <p className="text-xs text-muted-foreground">
          Vraies photos d&apos;atelier : partez des plis de tissu, découpez,
          réunissez les petites pièces, puis cousez.
        </p>
      </header>

      <div className="p-4 sm:p-5">
        {/* Photo du geste en cours */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/60 bg-accent/30 sm:aspect-[16/9]"
          role="group"
          aria-label={`Geste ${idx + 1} sur 5 : ${stage.title}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(idx + 1);
            if (e.key === "ArrowLeft") go(idx - 1);
          }}
          tabIndex={0}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={stage.src}
              src={stage.src}
              alt={stage.alt}
              initial={{ opacity: 0, scale: 1.025 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070d24]/80 via-transparent to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <Badge className="mb-1.5 gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold text-foreground backdrop-blur">
                <Icon className="size-3 text-primary" />
                Geste {idx + 1}/5
              </Badge>
              <p className="truncate font-display text-[15px] font-bold text-white drop-shadow sm:text-base">
                {stage.title}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => go(idx - 1)}
                aria-label="Geste précédent"
                className="grid size-9 place-items-center rounded-full bg-background/85 text-foreground shadow backdrop-blur transition hover:bg-background"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => go(idx + 1)}
                aria-label="Geste suivant"
                className="grid size-9 place-items-center rounded-full bg-background/85 text-foreground shadow backdrop-blur transition hover:bg-background"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Explication du geste */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="mt-4"
          >
            <p className="text-[13.5px] leading-relaxed text-foreground/90">
              {stage.desc}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {stage.tips.map((tip) => (
                <li
                  key={tip}
                  className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        {/* Pastilles des 5 gestes */}
        <div className="mt-4 flex snap-x gap-1.5 overflow-x-auto pb-1">
          {STAGES.map((s, i) => {
            const ChipIcon = s.icon;
            const active = i === idx;
            const done = i < idx;
            return (
              <button
                key={s.chip}
                onClick={() => setIdx(i)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow"
                    : done
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <ChipIcon className="size-3.5" />
                {i + 1} · {s.chip}
              </button>
            );
          })}
        </div>

        {/* Continuité vers l'atelier */}
        {idx === STAGES.length - 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-[12.5px] font-medium text-foreground"
          >
            À vous de jouer : coupez vos pièces ci-dessous, puis l&apos;atelier
            de couture reprend le fil geste par geste.
          </motion.p>
        )}
      </div>
    </section>
  );
}
