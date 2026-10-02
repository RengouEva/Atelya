"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GitMerge,
  Layers,
  MousePointerClick,
  MoveHorizontal,
  RotateCcw,
  Ruler,
  Scissors,
  Sparkles,
  TriangleAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModelsCard } from "@/components/atelier/models-card";
import { MeasuresCard, type MeasureField } from "@/components/atelier/measures-card";
import { ClientsCard, type Client } from "@/components/atelier/clients-card";
import { MethodCard } from "@/components/atelier/method-card";
import { FabricTable } from "@/components/atelier/fabric-table";
import { AssemblyPlayer } from "@/components/atelier/assembly-player";
import {
  ModelIcon,
  PieceMini,
  ProgressRing,
} from "@/components/atelier/pieces";
import {
  ASM,
  LETTERS,
  MODELS,
  buildLayout,
  buildMethod,
  meterage,
  type ModelKey,
} from "@/lib/atelier/patterns";

const CL_KEY = "atelier-cl";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function Home() {
  /* ----------------------------- état ----------------------------- */
  const [modelKey, setModelKey] = React.useState<ModelKey>("droite");
  const [P, setP] = React.useState("90");
  const [T, setT] = React.useState("70");
  const [H, setH] = React.useState("96");
  const [L, setL] = React.useState("60");
  const [W, setW] = React.useState("140");
  const [S, setS] = React.useState("1.5");
  const [C, setC] = React.useState("#2A9DB5");

  const [zoom, setZoom] = React.useState(1);
  const [cut, setCut] = React.useState<Set<number>>(new Set());
  const [cuttingId, setCuttingId] = React.useState<number | null>(null);
  const [checked, setChecked] = React.useState<Set<number>>(new Set());
  const [asmStep, setAsmStep] = React.useState(0);

  const [clients, setClients] = React.useState<Client[] | null>(null);
  const [clientSel, setClientSel] = React.useState("");
  const [clientName, setClientName] = React.useState("");

  const cutRef = React.useRef<Set<number>>(new Set());
  const busyRef = React.useRef<number | false>(false);
  const genRef = React.useRef(0);

  /* --------------------------- dérivés ---------------------------- */
  const model = MODELS[modelKey];
  const sa = +S || 0;
  const fw = +W || 140;

  const defs = React.useMemo(
    () => model.g({ P: +P || 0, T: +T || 0, H: +H || 0, L: +L || 0 }),
    [model, P, T, H, L]
  );
  const layout = React.useMemo(() => buildLayout(defs, sa, fw), [defs, sa, fw]);
  const method = React.useMemo(
    () => buildMethod(modelKey, layout, defs, sa),
    [modelKey, layout, defs, sa]
  );
  const meters = meterage(layout);
  const tooNarrow = layout.mx > layout.raw;
  const total = layout.pieces.length;
  const cutCount = cut.size;
  const cutPieces = layout.pieces.filter((p) => cut.has(p.id));

  const sig = `${modelKey}|${P}|${T}|${H}|${L}|${W}|${S}|${C}`;

  /* Toute modification réinitialise la session de coupe */
  React.useEffect(() => {
    genRef.current += 1;
    cutRef.current = new Set();
    setCut(new Set());
    setCuttingId(null);
    busyRef.current = false;
    setChecked(new Set());
    setAsmStep(0);
  }, [sig]);

  /* Fiches clientes (localStorage) */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CL_KEY);
      setClients(raw ? (JSON.parse(raw) as Client[]) : []);
    } catch {
      setClients([]);
    }
  }, []);

  const persistClients = (next: Client[]) => {
    setClients(next);
    try {
      localStorage.setItem(CL_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  };

  const saveClient = () => {
    const nom = clientName.trim();
    if (!nom) {
      toast.error("Donnez un nom à la fiche avant d’enregistrer.");
      return;
    }
    persistClients([
      ...(clients ?? []),
      { nom, P: +P || 0, T: +T || 0, H: +H || 0 },
    ]);
    setClientName("");
    toast.success(`Fiche de ${nom} enregistrée.`, {
      description: "Poitrine, taille et hanches mémorisées.",
    });
  };

  const applyClient = (v: string) => {
    setClientSel(v);
    const c = clients?.[+v];
    if (!c) return;
    setP(String(c.P));
    setT(String(c.T));
    setH(String(c.H));
    toast(`Mesures de ${c.nom} appliquées.`);
  };

  const deleteClient = () => {
    if (clientSel === "") return;
    const c = clients?.[+clientSel];
    persistClients((clients ?? []).filter((_, i) => i !== +clientSel));
    setClientSel("");
    if (c) toast(`Fiche de ${c.nom} supprimée.`);
  };

  /* ------------------------- découpe ------------------------------ */
  const runCut = (id: number) => {
    const gen = genRef.current;
    return new Promise<void>((resolve) => {
      if (cutRef.current.has(id) || busyRef.current !== false) {
        resolve();
        return;
      }
      busyRef.current = id;
      setCuttingId(id);
      window.setTimeout(() => {
        if (gen !== genRef.current) {
          resolve();
          return;
        }
        const next = new Set(cutRef.current);
        next.add(id);
        cutRef.current = next;
        setCut(next);
        setCuttingId(null);
        busyRef.current = false;
        if (total > 0 && next.size === total) {
          toast.success("Toutes les pièces sont coupées !", {
            description:
              "Reportez les repères avant de retirer le patron, puis passez à l’assemblage.",
          });
        }
        resolve();
      }, 1050);
    });
  };

  const cutAll = async () => {
    if (busyRef.current !== false) return;
    for (const p of layout.pieces) {
      if (cutRef.current.has(p.id)) continue;
      await runCut(p.id);
    }
  };

  const resetCut = () => {
    genRef.current += 1;
    cutRef.current = new Set();
    setCut(new Set());
    setCuttingId(null);
    busyRef.current = false;
  };

  /* --------------------------- divers ------------------------------ */
  const changeModel = (k: ModelKey) => {
    setModelKey(k);
    setL(String(MODELS[k].L));
  };

  const setMeasure = (k: MeasureField, v: string) => {
    switch (k) {
      case "P":
        setP(v);
        break;
      case "T":
        setT(v);
        break;
      case "H":
        setH(v);
        break;
      case "L":
        setL(v);
        break;
      case "W":
        setW(v);
        break;
      case "S":
        setS(v);
        break;
      case "C":
        setC(v);
        break;
    }
  };

  const toggleStep = (i: number) =>
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
      }
      return n;
    });

  /* ---------------------------- rendu ------------------------------ */
  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#D6336C] to-[#F0703F] text-white shadow-sm">
            <Scissors className="size-[18px]" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[17px] font-bold">Atelier de coupe</p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Patronage · mise en plan · assemblage
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="secondary"
              className="hidden gap-1 rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground sm:flex"
            >
              <Sparkles className="size-3 text-primary" />
              Édition premium
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 pt-6">
        {/* Introduction */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            L’atelier,{" "}
            <span className="bg-gradient-to-r from-[#D6336C] to-[#F0703F] bg-clip-text text-transparent dark:from-[#FF6B9A] dark:to-[#FFA94D]">
              du tissu à la pièce finie
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Choisissez un modèle, entrez les mesures : les pièces sont placées
            sur le tissu avec leurs marges de couture. Touchez une pièce pour la
            couper, suivez la méthode pas à pas, puis assemblez.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Barre latérale */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
            <ModelsCard value={modelKey} onChange={changeModel} />
            <MeasuresCard
              P={P}
              T={T}
              H={H}
              L={L}
              W={W}
              S={S}
              C={C}
              set={setMeasure}
            />
            <ClientsCard
              clients={clients}
              ready={clients !== null}
              selected={clientSel}
              onSelect={applyClient}
              name={clientName}
              onName={setClientName}
              onSave={saveClient}
              onDelete={deleteClient}
            />
          </aside>

          {/* Colonne principale */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Plan de coupe */}
            <motion.section
              {...reveal}
              aria-label="Plan de coupe"
              className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <ModelIcon kind={modelKey} className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold leading-tight">
                    {model.n}
                  </h2>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MousePointerClick className="size-3" />
                    Touchez une pièce pour la couper
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-full border-border/80 bg-background font-normal"
                  >
                    <Ruler className="size-3.5 text-primary" />
                    <span className="hidden sm:inline">Métrage</span>{" "}
                    <b className="tabular-nums">{meters} m</b>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hidden gap-1.5 rounded-full border-border/80 bg-background font-normal md:inline-flex"
                  >
                    <MoveHorizontal className="size-3.5 text-primary" />
                    <b className="tabular-nums">{layout.raw} cm</b>
                  </Badge>
                  <ProgressRing value={cutCount} total={total} size={44} />
                </div>
              </header>

              <div className="flex flex-col gap-3 p-4 sm:p-5">
                {tooNarrow && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span>
                      Le tissu est trop étroit. Il faut au moins{" "}
                      <b>{Math.ceil(layout.mx)} cm</b> de largeur pour ce
                      modèle.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={cutAll}
                    disabled={cutCount === total}
                    className="rounded-lg"
                  >
                    <Scissors className="size-4" />
                    Tout couper
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetCut}
                    className="rounded-lg"
                  >
                    <RotateCcw className="size-4" />
                    Recommencer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
                    className="rounded-lg"
                  >
                    {zoom === 1 ? (
                      <ZoomIn className="size-4" />
                    ) : (
                      <ZoomOut className="size-4" />
                    )}
                    {zoom === 1 ? "Zoom ×2" : "Zoom ×1"}
                  </Button>
                  <p className="ml-auto hidden text-xs tabular-nums text-muted-foreground md:block">
                    {cutCount} pièce{cutCount > 1 ? "s" : ""} coupée
                    {cutCount > 1 ? "s" : ""} sur {total}
                  </p>
                </div>

                <FabricTable
                  layout={layout}
                  fc={C}
                  sa={sa}
                  cut={cut}
                  cuttingId={cuttingId}
                  onCut={(id) => void runCut(id)}
                  zoom={zoom}
                />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Marges de couture de {sa} cm comprises autour de chaque pièce
                  · lisières en pointillés · règle graduée en cm · flèche =
                  droit-fil · « pli » = à couper au pli.
                </p>
              </div>
            </motion.section>

            {/* Méthode */}
            <motion.div {...reveal}>
              <MethodCard
                steps={method}
                checked={checked}
                onToggle={toggleStep}
              />
            </motion.div>

            {/* Pièces coupées */}
            <motion.section
              {...reveal}
              aria-label="Pièces coupées"
              className="card-luxe rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <Layers className="size-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[17px] font-bold leading-tight">
                    Pièces coupées
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Le panier de découpe, prêt pour l’assemblage
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {cutCount}/{total}
                </span>
              </header>
              <div className="p-5">
                {cutPieces.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/80 px-6 py-10 text-center">
                    <Scissors className="size-6 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Aucune pièce coupée pour l’instant — touchez une pièce sur
                      le plan de coupe ou lancez « Tout couper ».
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {cutPieces.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="rounded-xl border border-border/70 bg-background p-3"
                      >
                        <PieceMini p={p} fc={C} sa={sa} />
                        <p className="mt-2 truncate text-sm font-semibold">
                          {p.name}
                          {p.mir ? " (miroir)" : ""}
                        </p>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          {p.fold ? "à couper au pli" : `couture ${sa} cm`}
                          {p.note ? ` – ${p.note}` : ""}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Nomenclature */}
            <motion.section
              {...reveal}
              aria-label="Les pièces du modèle"
              className="card-luxe rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <ModelIcon kind={modelKey} className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-[17px] font-bold leading-tight">
                    Les pièces du modèle
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Nomenclature A, B, C… avec dimensions réelles
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-4">
                {defs.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/70 bg-background p-3"
                  >
                    <PieceMini p={p} fc={C} sa={sa} letter={LETTERS[i]} />
                    <p className="mt-2 truncate text-sm font-semibold">
                      {LETTERS[i]} – {p.n}
                    </p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {Math.round(p.w)} × {Math.round(p.h)} cm – {p.q} pièce
                      {p.q > 1 ? "s" : ""}
                      {p.fold ? ", au pli" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Assemblage */}
            <motion.section
              {...reveal}
              aria-label="Assemblage pas à pas"
              className="card-luxe rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <GitMerge className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-[17px] font-bold leading-tight">
                    Assemblage pas à pas
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Les pièces se rejoignent, endroit contre endroit
                  </p>
                </div>
              </header>
              <div className="p-5">
                <AssemblyPlayer
                  modelKey={modelKey}
                  defs={defs}
                  fc={C}
                  sa={sa}
                  step={asmStep}
                  onStep={setAsmStep}
                  resetKey={sig}
                />
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/60 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-xs text-muted-foreground">
          Atelier de coupe — patronage, mise en plan et assemblage, pensé pour
          les mains minutieuses.
        </p>
      </footer>
    </div>
  );
}
