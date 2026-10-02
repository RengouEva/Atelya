"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  GitMerge,
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
import { ClientsCard, type ApiClient } from "@/components/atelier/clients-card";
import { FabricTable } from "@/components/atelier/fabric-table";
import { AssemblyPlayer } from "@/components/atelier/assembly-player";
import { GarmentPreview } from "@/components/atelier/garment-preview";
import { AiStudio } from "@/components/atelier/ai-studio";
import {
  ModelIcon,
  PieceMini,
  ProgressRing,
} from "@/components/atelier/pieces";
import {
  FOLD,
  LETTERS,
  MODELS,
  buildLayout,
  meterage,
  type ModelKey,
} from "@/lib/atelier/patterns";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const clampN = (v: string, d: number, a: number, b: number) => {
  const n = +v;
  return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d;
};

export function AtelierApp({
  initialModel,
  onHome,
}: {
  initialModel?: ModelKey;
  onHome: () => void;
}) {
  /* ----------------------------- état ----------------------------- */
  const [modelKey, setModelKey] = React.useState<ModelKey>(initialModel ?? "droite");
  const [P, setP] = React.useState("90");
  const [T, setT] = React.useState("70");
  const [H, setH] = React.useState("98");
  const [L, setL] = React.useState(String(MODELS[initialModel ?? "droite"].L));
  const [W, setW] = React.useState("140");
  const [S, setS] = React.useState("1.5");
  const [C, setC] = React.useState("#2A9DB5");

  const [zoom, setZoom] = React.useState(1);
  const [cut, setCut] = React.useState<Set<number>>(new Set());
  const [cuttingId, setCuttingId] = React.useState<number | null>(null);
  const [asmStep, setAsmStep] = React.useState(0);

  const [clients, setClients] = React.useState<ApiClient[] | null>(null);
  const [clBusy, setClBusy] = React.useState(false);
  const [clientSel, setClientSel] = React.useState("");
  const [clientName, setClientName] = React.useState("");

  const cutRef = React.useRef<Set<number>>(new Set());
  const busyRef = React.useRef<number | false>(false);
  const genRef = React.useRef(0);

  /* --------------------------- dérivés ---------------------------- */
  const model = MODELS[modelKey];
  const sa = +S || 0;
  const fw = +W || 140;

  const mm = React.useMemo(
    () => ({
      P: clampN(P, 90, 60, 160),
      T: clampN(T, 70, 40, 160),
      H: clampN(H, 98, 60, 180),
      L: clampN(L, model.L, 15, 200),
    }),
    [P, T, H, L, model.L]
  );

  const defs = React.useMemo(() => model.g(mm), [model, mm]);
  const layout = React.useMemo(() => buildLayout(defs, sa, fw), [defs, sa, fw]);
  const meters = meterage(layout);
  const tooNarrow = layout.mx > layout.raw;
  const total = layout.pieces.length;
  const cutCount = cut.size;

  const sig = `${modelKey}|${P}|${T}|${H}|${L}|${W}|${S}|${C}`;

  /* Toute modification réinitialise la session de coupe */
  React.useEffect(() => {
    genRef.current += 1;
    cutRef.current = new Set();
    setCut(new Set());
    setCuttingId(null);
    busyRef.current = false;
    setAsmStep(0);
  }, [sig]);

  /* --------------------- fiches clientes (API) --------------------- */
  const refreshClients = React.useCallback(async () => {
    try {
      const r = await fetch("/api/clients", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const j = (await r.json()) as { clients?: ApiClient[] };
      setClients(j.clients ?? []);
    } catch {
      setClients([]);
      toast.error("Backend injoignable : fiches clientes indisponibles.");
    }
  }, []);

  React.useEffect(() => {
    void refreshClients();
  }, [refreshClients]);

  const saveClient = async () => {
    const nom = clientName.trim();
    if (!nom) {
      toast.error("Donnez un nom à la fiche avant d'enregistrer.");
      return;
    }
    setClBusy(true);
    try {
      const payload = { name: nom, P: mm.P, T: mm.T, H: mm.H, L: mm.L };
      const res = await fetch(
        clientSel ? `/api/clients/${clientSel}` : "/api/clients",
        {
          method: clientSel ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const j = (await res.json().catch(() => ({}))) as {
        client?: ApiClient;
        error?: string;
      };
      if (!res.ok || !j.client) throw new Error(j.error ?? "Enregistrement impossible.");
      const client = j.client;
      setClients((prev) =>
        prev
          ? clientSel
            ? prev.map((c) => (c.id === client.id ? client : c))
            : [...prev, client]
          : [client]
      );
      setClientSel(client.id);
      setClientName("");
      toast.success(
        clientSel ? `Fiche de ${nom} mise à jour.` : `Fiche de ${nom} enregistrée.`,
        { description: "Mesures conservées dans la base de l'atelier." }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setClBusy(false);
    }
  };

  const deleteClient = async () => {
    if (!clientSel || clBusy) return;
    setClBusy(true);
    const c = clients?.find((x) => x.id === clientSel);
    try {
      const res = await fetch(`/api/clients/${clientSel}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible.");
      setClients((prev) => prev?.filter((x) => x.id !== clientSel) ?? []);
      setClientSel("");
      if (c) toast(`Fiche de ${c.name} supprimée.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setClBusy(false);
    }
  };

  const applyClient = (id: string) => {
    setClientSel(id);
    const c = clients?.find((x) => x.id === id);
    if (!c) return;
    setP(String(c.P));
    setT(String(c.T));
    setH(String(c.H));
    setL(String(c.L));
    setClientName(c.name);
    toast(`Mesures de ${c.name} appliquées.`);
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
              "Reportez les repères avant de retirer le patron, puis passez à l'assemblage.",
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

  /* ---------------------------- rendu ------------------------------ */
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
                Atelier de coupe
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Patronage · mise en plan · assemblage
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
              {Object.keys(MODELS).length} modèles
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 pt-6">
        {/* Introduction */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            L'atelier,{" "}
            <span className="bg-gradient-to-r from-[#D6336C] to-[#F0703F] bg-clip-text text-transparent dark:from-[#FF6B9A] dark:to-[#FFA94D]">
              du tissu à la pièce finie
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Choisissez un modèle, entrez les mesures : les pièces sont placées
            sur le tissu avec leurs marges de couture. Touchez une pièce pour la
            couper, suivez la méthode pas à pas, puis assemblez — l'aperçu du
            vêtement se met à jour en temps réel.
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
              busy={clBusy}
              selected={clientSel}
              onSelect={applyClient}
              name={clientName}
              onName={setClientName}
              onSave={() => void saveClient()}
              onDelete={() => void deleteClient()}
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

            {/* Aperçu & style */}
            <motion.section
              {...reveal}
              aria-label="Aperçu du vêtement et du style"
              className="card-luxe overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <Eye className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-[17px] font-bold leading-tight">
                    Aperçu & style
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Le vêtement obtenu, dessiné sur vos mesures
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto hidden gap-1 rounded-full border-border/80 bg-background font-normal sm:inline-flex"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  Temps réel
                </Badge>
              </header>
              <div className="grid items-center gap-5 p-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
                <div className="rounded-xl border border-border/60 bg-gradient-to-b from-accent/60 via-background to-background p-4">
                  <GarmentPreview
                    m={mm}
                    modelKey={modelKey}
                    fc={C}
                    className="mx-auto h-64 w-auto max-w-full sm:h-72"
                    label={`Aperçu : ${model.n}`}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    {model.n}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {model.desc}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {model.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="rounded-full bg-accent px-2.5 text-[11px] font-medium text-accent-foreground"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Difficulté
                      </dt>
                      <dd className="mt-1 flex items-center gap-1">
                        {[1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`size-2 rounded-full ${
                              i <= model.diff ? "bg-primary" : "bg-border"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {model.diff === 1
                            ? "Facile"
                            : model.diff === 2
                              ? "Intermédiaire"
                              : "Avancé"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Pièces à couper
                      </dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {total}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Métrage
                      </dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {meters} m · {layout.raw} cm
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Tissu conseillé
                      </dt>
                      <dd className="mt-1 font-medium">{model.fab}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Pliage du tissu
                      </dt>
                      <dd className="mt-1 text-[13px] leading-snug text-muted-foreground">
                        {FOLD[modelKey]}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </motion.section>

            {/* Studio IA — visuels réalistes */}
            <AiStudio modelKey={modelKey} m={mm} fc={C} />

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
                    Montage pas à pas
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Coutures numérotées, bord à bord — jusqu'au produit fini
                    porté sur mannequin
                  </p>
                </div>
              </header>
              <div className="p-5">
                <AssemblyPlayer
                  modelKey={modelKey}
                  m={mm}
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
