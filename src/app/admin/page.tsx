"use client";

import * as React from "react";
import {
  BadgeCheck,
  Box,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Ruler,
  Scissors,
  Shirt,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModelIcon } from "@/components/atelier/pieces";
import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/studio/client";
import {
  DEFAULT_MEASURES,
  FABRIC_PRESETS,
  type StudioMeasures,
} from "@/lib/studio/config";
import {
  ACCESSORIES,
  CATEGORY_TEMPLATES,
  CATEGORIES,
  categoryByKey,
  type AccessoryKey,
  type AdminPiece,
  type CatalogModel,
  type CategoryKey,
  type PieceShape,
  type ShapeParams,
} from "@/lib/atelier/garments";

const MEASURE_FIELDS: { key: "P" | "T" | "H" | "L"; label: string }[] = [
  { key: "P", label: "Poitrine" },
  { key: "T", label: "Taille" },
  { key: "H", label: "Hanches" },
  { key: "L", label: "Longueur" },
];

const JOINS: { v: string; l: string }[] = [
  { v: "", l: "— préparation —" },
  { v: "ll", l: "miroir à gauche" },
  { v: "rr", l: "miroir à droite" },
  { v: "rl", l: "bord à droite" },
  { v: "tt", l: "miroir au-dessus" },
  { v: "tc", l: "au-dessus, centré" },
  { v: "bt", l: "en dessous" },
  { v: "ct", l: "centré dessus" },
];

/** Étape d'assemblage éditée en objet, convertie en tuple à l'envoi. */
interface EditStep {
  s: string;
  a: string;
  b: string;
  j: string;
  d: string;
}

/**
 * Espace atelier — l'encadrement compose le catalogue : modèles par
 * catégorie (photo, mesures, pièces de patronage, méthode d'assemblage,
 * accessoires) que les apprentis suivront pas à pas.
 */
export default function AdminPage() {
  const [session, setSession] = React.useState<"loading" | "in" | "out">("loading");
  const [models, setModels] = React.useState<CatalogModel[]>([]);
  const [editing, setEditing] = React.useState<CatalogModel | null>(null);

  const refresh = async () => {
    try {
      const [s, g] = await Promise.all([
        fetch("/api/admin/login").then((r) => r.json()) as Promise<{ admin: boolean }>,
        fetch("/api/models?all=1").then((r) => r.json()) as Promise<{ models: CatalogModel[] }>,
      ]);
      setSession(s.admin ? "in" : "out");
      setModels(g.models ?? []);
    } catch {
      setSession("out");
    }
  };

  React.useEffect(() => {
    void refresh();
  }, []);

  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setSession("out");
    toast.success("Session atelier fermée.");
  };

  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <img src="/atelya-mark.webp" alt="" className="h-8 w-auto" />
            <span className="font-display text-[17px] font-bold tracking-tight">Atelya</span>
            <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground">
              Espace atelier
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {session === "in" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                className="gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Quitter</span>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-4">
        {session === "loading" && (
          <div className="grid place-items-center py-24 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        {session === "out" && <LoginCard onIn={() => void refresh()} />}
        {session === "in" && (
          <div className="flex flex-col gap-6">
            <Intro />
            <ModelForm
              editing={editing}
              onEdited={() => {
                setEditing(null);
                void refresh();
              }}
            />
            <ModelList
              models={models}
              onEdit={(m) => {
                setEditing(m);
                window.scrollTo({ top: 0 });
              }}
              onChanged={() => void refresh()}
            />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/50 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Catalogue validé par l&apos;atelier
        </p>
      </footer>
    </div>
  );
}

/* Carte de connexion -------------------------------------------------- */

function LoginCard({ onIn }: { onIn: () => void }) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Code incorrect.");
      toast.success("Bienvenue dans l'espace atelier.");
      onIn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Code incorrect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-sm">
      <div className="card-luxe rounded-3xl border border-border/70 bg-card p-7 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold">Espace atelier</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Réservé à l&apos;encadrement : composez le catalogue de modèles
          (photo, pièces de patronage, assemblage, accessoires) que les
          apprentis suivront pas à pas.
        </p>
        <div className="mt-5 text-left">
          <Label htmlFor="admin-code" className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Code de l&apos;atelier
          </Label>
          <Input
            id="admin-code"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="Code confidentiel"
            className="mt-2 rounded-xl text-center"
          />
        </div>
        <Button
          onClick={() => void submit()}
          disabled={!code.trim() || busy}
          size="lg"
          className="mt-4 h-12 w-full rounded-full text-[15px] font-bold shadow-lg"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
          Entrer
        </Button>
      </div>
    </div>
  );
}

/* Introduction --------------------------------------------------------- */

function Intro() {
  return (
    <section className="rounded-2xl border border-primary/25 bg-accent/50 px-4 py-3.5">
      <p className="text-[13px] leading-relaxed text-foreground/90">
        <span className="font-bold">Pour être sûr de la qualité :</span>{" "}
        chaque modèle que vous publiez apparaît dans le catalogue des
        apprentis, classé par catégorie. Ils partent de votre photo, de vos
        pièces et de votre méthode — le patronage s&apos;ajuste à leurs
        mesures, sans interprétation.
      </p>
    </section>
  );
}

/* Formulaire modèle ----------------------------------------------------- */

function ModelForm({
  editing,
  onEdited,
}: {
  editing: CatalogModel | null;
  onEdited: () => void;
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<CategoryKey>("robe");
  const [description, setDescription] = React.useState("");
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [measures, setMeasures] = React.useState<StudioMeasures>({ ...DEFAULT_MEASURES, L: 90 });
  const [shape, setShape] = React.useState<ShapeParams>({ ...categoryByKey("robe").shape });
  const [pieces, setPieces] = React.useState<AdminPiece[]>([]);
  const [steps, setSteps] = React.useState<EditStep[]>([]);
  const [accessories, setAccessories] = React.useState<AccessoryKey[]>([]);
  const [published, setPublished] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [loadingPhoto, setLoadingPhoto] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  /* Pré-remplissage : édition d'un modèle existant ou gabarit de catégorie */
  React.useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setDescription(editing.description ?? "");
      setPhoto(editing.photo || null);
      setMeasures({ ...DEFAULT_MEASURES, ...editing.baseMeasures });
      setShape(editing.shape);
      setPieces(editing.pieces.map((p) => ({ ...p })));
      setSteps(
        editing.assembly.map((s) => ({
          s: s[0] ?? "",
          a: s[1] ?? "",
          b: s[2] ?? "",
          j: s[3] ?? "",
          d: s[4] ?? "",
        }))
      );
      setAccessories(editing.accessories);
      setPublished(editing.published);
    } else {
      applyTemplate("robe");
    }
  }, [editing]);

  const applyTemplate = (k: CategoryKey) => {
    const tpl = CATEGORY_TEMPLATES[k];
    const def = categoryByKey(k);
    setShape({ ...def.shape });
    setPieces(tpl.pieces.map((p) => ({ ...p })));
    setSteps(
      tpl.assembly.map((s) => ({
        s: s[0] ?? "",
        a: s[1] ?? "",
        b: s[2] ?? "",
        j: s[3] ?? "",
        d: s[4] ?? "",
      }))
    );
    setAccessories([...tpl.accessories]);
    setMeasures((m) => ({ ...m, L: def.L }));
  };

  const changeCategory = (k: CategoryKey) => {
    setCategory(k);
    if (!editing) applyTemplate(k);
  };

  const takeFile = async (f: File | undefined) => {
    if (!f) return;
    setLoadingPhoto(true);
    try {
      setPhoto(await fileToDataUrl(f));
    } catch {
      toast.error("Photo illisible — choisissez une image JPEG ou PNG.");
    } finally {
      setLoadingPhoto(false);
    }
  };

  const stepTuples = () =>
    steps
      .filter((st) => st.s.trim())
      .map((st) => [
        st.s,
        st.a || undefined,
        st.b || undefined,
        (st.j || undefined) as never,
        st.d || undefined,
      ]);

  const submit = async () => {
    if (!name.trim() || pieces.length === 0 || busy) return;
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        photo: photo ?? "",
        description: description.trim() || undefined,
        baseMeasures: measures,
        shape,
        pieces,
        assembly: stepTuples(),
        accessories,
        published,
      };
      const r = await fetch(
        editing ? `/api/models/${editing.id}` : "/api/models",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Enregistrement impossible.");
      toast.success(
        editing
          ? "Modèle mis à jour — le catalogue est à jour."
          : "Modèle publié — il apparaît dans le catalogue des apprentis."
      );
      setName("");
      setDescription("");
      setPhoto(null);
      onEdited();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const updPiece = (i: number, patch: Partial<AdminPiece>) =>
    setPieces((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const updStep = (i: number, patch: Partial<EditStep>) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <section className="card-luxe rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-bold">
          {editing ? `Modifier « ${editing.name} »` : "Ajouter un modèle au catalogue"}
        </h2>
        {editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdited()}
            className="ml-auto gap-1 rounded-full text-xs"
          >
            <X className="size-3.5" />
            Annuler
          </Button>
        )}
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Photo, catégorie, mesures de référence, pièces du patronage, méthode
        d&apos;assemblage et accessoires — tout vient de vous.
      </p>

      {/* Identité + photo */}
      <div className="mt-4 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div>
          {!photo ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Déposer la photo du modèle"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void takeFile(e.dataTransfer.files?.[0]);
              }}
              className="grid min-h-[190px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-accent/30 p-5 text-center outline-none ring-primary/50 transition focus-visible:ring-2 hover:border-primary/50"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                  {loadingPhoto ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                </span>
                <p className="text-[13px] font-semibold">Photo du vêtement</p>
                <p className="text-[10.5px] text-muted-foreground">JPEG ou PNG — redimensionnée automatiquement</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void takeFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
              <img src={photo} alt="Photo du modèle" className="max-h-[240px] w-full object-contain" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhoto(null)}
                className="absolute right-2 top-2 gap-1 rounded-full bg-background/85 text-xs backdrop-blur"
              >
                <X className="size-3.5" />
                Retirer
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="m-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nom du modèle
            </Label>
            <Input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Robe trapèze — référence 01"
              className="mt-2 rounded-xl"
              maxLength={60}
            />
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Shirt className="size-3.5" />
              Catégorie
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Catégorie du vêtement">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  role="radio"
                  aria-checked={category === c.key}
                  onClick={() => changeCategory(c.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium outline-none ring-primary/50 transition focus-visible:ring-2",
                    category === c.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-accent text-accent-foreground hover:bg-accent/70"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {!editing && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Changer de catégorie pré-remplit pièces, assemblage et
                accessoires avec le gabarit de l&apos;atelier — à ajuster ensuite.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="m-desc" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Description (facultative)
            </Label>
            <Input
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Ligne fluide, facile à coudre — idéale débutant"
              className="mt-2 rounded-xl"
              maxLength={200}
            />
          </div>
        </div>
      </div>

      {/* Mesures de référence */}
      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Ruler className="size-3.5" />
          Mesures de référence (cm)
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {MEASURE_FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`m-${f.key}`} className="text-[11px] font-medium">
                {f.label}
              </Label>
              <Input
                id={`m-${f.key}`}
                type="number"
                inputMode="numeric"
                value={String(measures[f.key])}
                onChange={(e) => setMeasures({ ...measures, [f.key]: +e.target.value || 0 })}
                className="mt-1 rounded-xl px-2 text-center"
              />
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="m-w" className="text-[11px] font-medium">
              Laize du tissu
            </Label>
            <Input
              id="m-w"
              type="number"
              value={String(measures.W)}
              onChange={(e) => setMeasures({ ...measures, W: +e.target.value || 0 })}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="m-s" className="text-[11px] font-medium">
              Marge de couture
            </Label>
            <Input
              id="m-s"
              type="number"
              step="0.5"
              value={String(measures.S)}
              onChange={(e) => setMeasures({ ...measures, S: +e.target.value || 0 })}
              className="mt-1 rounded-xl"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Coloris</span>
          {FABRIC_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setMeasures({ ...measures, C: c })}
              aria-label={`Coloris ${c}`}
              aria-pressed={measures.C === c}
              className={cn(
                "size-6 rounded-full border-2 outline-none ring-primary/50 transition focus-visible:ring-2",
                measures.C === c ? "border-foreground shadow-md" : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Forme 3D */}
      <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Box className="size-3.5" />
          Forme 3D (essayage virtuel)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="sh-len" className="text-[11px] font-medium">Longueur (cm)</Label>
            <Input
              id="sh-len"
              type="number"
              value={String(shape.length)}
              onChange={(e) => setShape({ ...shape, length: +e.target.value || 0 })}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="sh-slv" className="text-[11px] font-medium">Manches</Label>
            <select
              id="sh-slv"
              value={shape.sleeves}
              onChange={(e) => setShape({ ...shape, sleeves: e.target.value as ShapeParams["sleeves"] })}
              className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
            >
              <option value="none">Sans</option>
              <option value="short">Courtes</option>
              <option value="three_quarter">3/4</option>
              <option value="long">Longues</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sh-col" className="text-[11px] font-medium">Col / encolure</Label>
            <select
              id="sh-col"
              value={shape.collar}
              onChange={(e) => setShape({ ...shape, collar: e.target.value as ShapeParams["collar"] })}
              className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
            >
              <option value="round">Rond</option>
              <option value="v">V</option>
              <option value="shirt">Chemise</option>
              <option value="lapel">Revers (veste)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sh-fit" className="text-[11px] font-medium">Coupe</Label>
            <select
              id="sh-fit"
              value={shape.fit}
              onChange={(e) => setShape({ ...shape, fit: e.target.value as ShapeParams["fit"] })}
              className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
            >
              <option value="fitted">Cintrée</option>
              <option value="straight">Droite</option>
              <option value="loose">Ample</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[12.5px] font-medium">
            <Switch
              checked={shape.waistband}
              onCheckedChange={(v) => setShape({ ...shape, waistband: v })}
              aria-label="Ceinture à la taille"
            />
            Ceinture à la taille
          </label>
          <label className="flex flex-1 items-center gap-2 text-[12.5px] font-medium">
            Évasement
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={shape.flare}
              onChange={(e) => setShape({ ...shape, flare: +e.target.value })}
              className="flex-1 accent-primary"
            />
            <span className="w-8 text-right tabular-nums text-muted-foreground">
              {Math.round(shape.flare * 100)}%
            </span>
          </label>
        </div>
      </div>

      {/* Pièces de patronage */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Scissors className="size-3.5" />
            Pièces du patronage
          </p>
          <Badge variant="outline" className="rounded-full font-normal">
            {pieces.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPieces((ps) => [
                ...ps,
                { n: "Nouvelle pièce", w: 25, h: 60, q: 1, shape: "trapeze" },
              ])
            }
            className="ml-auto gap-1 rounded-full text-xs"
          >
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {pieces.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-2.5"
            >
              <div className="grid gap-2 sm:grid-cols-[1.4fr_repeat(3,0.6fr)_1fr]">
                <Input
                  value={p.n}
                  onChange={(e) => updPiece(i, { n: e.target.value })}
                  placeholder="Nom"
                  aria-label={`Nom de la pièce ${i + 1}`}
                  className="h-9 rounded-lg text-[13px]"
                  maxLength={40}
                />
                <select
                  value={p.shape}
                  onChange={(e) => updPiece(i, { shape: e.target.value as PieceShape })}
                  aria-label={`Silhouette de la pièce ${i + 1}`}
                  className="h-9 rounded-lg border border-input bg-background px-1.5 text-[12px]"
                >
                  <option value="trapeze">Évasée</option>
                  <option value="rect">Rectangle</option>
                  <option value="sleeve">Manche</option>
                  <option value="pant">Jambe</option>
                  <option value="band">Bande</option>
                </select>
                <Input
                  type="number"
                  value={String(p.w)}
                  onChange={(e) => updPiece(i, { w: +e.target.value || 0 })}
                  aria-label={`Largeur (cm) — pièce ${i + 1}`}
                  className="h-9 rounded-lg px-2 text-center text-[13px]"
                />
                <Input
                  type="number"
                  value={String(p.h)}
                  onChange={(e) => updPiece(i, { h: +e.target.value || 0 })}
                  aria-label={`Longueur (cm) — pièce ${i + 1}`}
                  className="h-9 rounded-lg px-2 text-center text-[13px]"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={String(p.q)}
                    onChange={(e) => updPiece(i, { q: +e.target.value || 1 })}
                    aria-label={`Quantité — pièce ${i + 1}`}
                    className="h-9 w-14 rounded-lg px-2 text-center text-[13px]"
                  />
                  <label className="flex items-center gap-1.5 text-[12px] font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(p.fold)}
                      onChange={(e) => updPiece(i, { fold: e.target.checked })}
                      className="size-4 accent-primary"
                      aria-label={`Au pli — pièce ${i + 1}`}
                    />
                    au pli
                  </label>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPieces((ps) => ps.filter((_, j) => j !== i))}
                aria-label={`Retirer la pièce ${i + 1}`}
                className="size-8 rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Méthode d'assemblage */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            Méthode d&apos;assemblage
          </p>
          <Badge variant="outline" className="rounded-full font-normal">
            {steps.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSteps((ss) => [...ss, { s: "", a: "", b: "", j: "", d: "" }])}
            className="ml-auto gap-1 rounded-full text-xs"
          >
            <Plus className="size-3.5" />
            Ajouter une étape
          </Button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-2.5"
            >
              <div className="grid gap-1.5">
                <Input
                  value={st.s}
                  onChange={(e) => updStep(i, { s: e.target.value })}
                  placeholder={`Consigne de l'étape ${i + 1} — ex. Assemblez les côtés, endroit contre endroit`}
                  aria-label={`Consigne de l'étape ${i + 1}`}
                  className="h-9 rounded-lg text-[13px]"
                  maxLength={300}
                />
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <Input
                    value={st.a}
                    onChange={(e) => updStep(i, { a: e.target.value })}
                    placeholder="Pièce fixe"
                    aria-label={`Pièce fixe — étape ${i + 1}`}
                    className="h-8 rounded-lg text-[12px]"
                    maxLength={40}
                  />
                  <Input
                    value={st.b}
                    onChange={(e) => updStep(i, { b: e.target.value })}
                    placeholder="Pièce posée"
                    aria-label={`Pièce posée — étape ${i + 1}`}
                    className="h-8 rounded-lg text-[12px]"
                    maxLength={40}
                  />
                  <select
                    value={st.j}
                    onChange={(e) => updStep(i, { j: e.target.value })}
                    aria-label={`Type de jonction — étape ${i + 1}`}
                    className="h-8 rounded-lg border border-input bg-background px-1.5 text-[12px]"
                  >
                    {JOINS.map((j) => (
                      <option key={j.v} value={j.v}>
                        {j.l}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={st.d}
                    onChange={(e) => updStep(i, { d: e.target.value })}
                    placeholder="Détail couture"
                    aria-label={`Détail — étape ${i + 1}`}
                    className="h-8 rounded-lg text-[12px]"
                    maxLength={300}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSteps((ss) => ss.filter((_, j) => j !== i))}
                aria-label={`Retirer l'étape ${i + 1}`}
                className="size-8 rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {steps.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
              Aucune étape — ajoutez le pas-à-pas que suivront les apprentis.
            </p>
          )}
        </div>
      </div>

      {/* Accessoires + publication */}
      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Accessoires proposés dans la confection 3D
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCESSORIES.map((a) => {
            const active = accessories.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() =>
                  setAccessories((as) =>
                    active ? as.filter((k) => k !== a.key) : [...as, a.key]
                  )
                }
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold outline-none ring-primary/50 transition focus-visible:ring-2",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 bg-background text-foreground hover:border-primary/40"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
        <label className="flex items-center gap-2.5 text-[13px] font-semibold">
          <Switch checked={published} onCheckedChange={setPublished} aria-label="Publier le modèle" />
          {published ? "Publié — visible des apprentis" : "Brouillon — invisible des apprentis"}
        </label>
        <Button
          onClick={() => void submit()}
          disabled={!name.trim() || pieces.length === 0 || busy}
          size="lg"
          className="h-11 min-w-[220px] rounded-full text-[14px] font-bold shadow-lg"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
          {editing ? "Enregistrer les modifications" : "Publier le modèle"}
        </Button>
      </div>
    </section>
  );
}

/* Liste des modèles ------------------------------------------------------ */

function ModelList({
  models,
  onEdit,
  onChanged,
}: {
  models: CatalogModel[];
  onEdit: (m: CatalogModel) => void;
  onChanged: () => void;
}) {
  const togglePublished = async (m: CatalogModel) => {
    try {
      const r = await fetch(`/api/models/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !m.published }),
      });
      if (!r.ok) throw new Error();
      toast.success(!m.published ? "Modèle publié." : "Modèle retiré du catalogue.");
      onChanged();
    } catch {
      toast.error("Mise à jour impossible.");
    }
  };

  const remove = async (m: CatalogModel) => {
    try {
      const r = await fetch(`/api/models/${m.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success(`« ${m.name} » retiré du catalogue.`);
      onChanged();
    } catch {
      toast.error("Suppression impossible.");
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-bold">Catalogue de l&apos;atelier</h2>
        <Badge variant="outline" className="rounded-full font-normal">
          {models.length}
        </Badge>
      </div>
      {models.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun modèle pour l&apos;instant — ajoutez le premier ci-dessus :
          il apparaîtra immédiatement dans l&apos;atelier des apprentis.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {models.map((m) => (
            <article
              key={m.id}
              className="card-luxe flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-3"
            >
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={m.name}
                  className="size-24 shrink-0 rounded-xl border border-border/60 object-cover"
                />
              ) : (
                <span className="grid size-24 shrink-0 place-items-center rounded-xl border border-border/60 bg-accent/40 text-primary/70">
                  <ModelIcon kind={categoryByKey(m.category).icon} className="size-10" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-bold leading-tight">{m.name}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {categoryByKey(m.category).label} · {m.pieces.length} pièces ·{" "}
                      {m.assembly.length} étapes · L{m.shape.length} cm
                    </p>
                  </div>
                  {m.published ? (
                    <Badge className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Publié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Brouillon
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(m)}
                    className="h-7 rounded-full px-3 text-[11.5px] font-semibold"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void togglePublished(m)}
                    className="h-7 rounded-full px-3 text-[11.5px] font-semibold"
                  >
                    {m.published ? "Retirer" : "Publier"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(m)}
                    className="h-7 gap-1 rounded-full px-2.5 text-[11.5px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
