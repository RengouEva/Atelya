"use client";

import * as React from "react";
import {
  BadgeCheck,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  Ruler,
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
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/studio/client";
import {
  DEFAULT_MEASURES,
  FABRIC_PRESETS,
  FAMILIES,
  familyByKey,
  type FamilyKey,
  type StudioMeasures,
} from "@/lib/studio/config";

/** Un exemple publié par l'atelier (renvoyé par /api/examples). */
interface StudioExample {
  id: string;
  name: string;
  photo: string;
  family: string;
  measures: StudioMeasures;
  note: string | null;
}

const MEASURE_FIELDS: { key: keyof StudioMeasures; label: string }[] = [
  { key: "P", label: "Poitrine" },
  { key: "T", label: "Taille" },
  { key: "H", label: "Hanches" },
  { key: "L", label: "Longueur" },
];

/**
 * Espace atelier — l'encadrement publie les exemples de référence
 * (photo + famille + mesures) que les apprentis utiliseront tels quels.
 */
export default function AdminPage() {
  const [session, setSession] = React.useState<"loading" | "in" | "out">("loading");
  const [examples, setExamples] = React.useState<StudioExample[]>([]);

  const refresh = async () => {
    try {
      const [s, g] = await Promise.all([
        fetch("/api/admin/login").then((r) => r.json()) as Promise<{ admin: boolean }>,
        fetch("/api/examples").then((r) => r.json()) as Promise<{ examples: StudioExample[] }>,
      ]);
      setSession(s.admin ? "in" : "out");
      setExamples(g.examples ?? []);
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
            <PublishForm onPublished={() => void refresh()} />
            <ExampleList examples={examples} onDeleted={() => void refresh()} />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/50 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Exemples validés par l&apos;atelier
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
          Réservé à l&apos;encadrement : publiez les exemples de référence
          (photo, famille, mesures) que les apprentis suivront pas à pas.
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
        chaque exemple que vous publiez apparaît dans l&apos;atelier des
        apprentis. Ils partent de votre photo et de vos mesures — le
        patronage et la méthode d&apos;assemblage sont générés sur ces
        références, sans surprise.
      </p>
    </section>
  );
}

/* Formulaire de publication -------------------------------------------- */

function PublishForm({ onPublished }: { onPublished: () => void }) {
  const [name, setName] = React.useState("");
  const [family, setFamily] = React.useState<FamilyKey>("robe");
  const [measures, setMeasures] = React.useState<StudioMeasures>(DEFAULT_MEASURES);
  const [note, setNote] = React.useState("");
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadingPhoto, setLoadingPhoto] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const changeFamily = (f: FamilyKey) => {
    setFamily(f);
    setMeasures((m) => ({ ...m, L: familyByKey(f).L }));
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

  const submit = async () => {
    if (!photo || !name.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), photo, family, measures, note: note.trim() || undefined }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Publication impossible.");
      toast.success("Exemple publié — il apparaît dans l'atelier des apprentis.");
      setName("");
      setNote("");
      setPhoto(null);
      onPublished();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-luxe rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="font-display text-lg font-bold">Publier un exemple</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Photo du vêtement fini + famille + mesures de référence.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Photo */}
        <div>
          {!photo ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Déposer la photo de l'exemple"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void takeFile(e.dataTransfer.files?.[0]);
              }}
              className="grid min-h-[220px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-accent/30 p-6 text-center outline-none ring-primary/50 transition focus-visible:ring-2 hover:border-primary/50"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
                  {loadingPhoto ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                </span>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <ImagePlus className="size-3.5 text-primary" />
                  Photo du vêtement
                </p>
                <p className="text-[11px] text-muted-foreground">JPEG ou PNG, redimensionnée automatiquement</p>
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
              <img src={photo} alt="Photo de l'exemple" className="max-h-[280px] w-full object-contain" />
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

        {/* Réglages */}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="ex-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nom de l&apos;exemple
            </Label>
            <Input
              id="ex-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Robe fourreau — référence 01"
              className="mt-2 rounded-xl"
              maxLength={60}
            />
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Shirt className="size-3.5" />
              Famille du vêtement
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Famille du vêtement">
              {FAMILIES.map((f) => (
                <button
                  key={f.key}
                  role="radio"
                  aria-checked={family === f.key}
                  onClick={() => changeFamily(f.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium outline-none ring-primary/50 transition focus-visible:ring-2",
                    family === f.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-accent text-accent-foreground hover:bg-accent/70"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Ruler className="size-3.5" />
              Mesures de référence (cm)
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {MEASURE_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label htmlFor={`ex-${f.key}`} className="text-[11px] font-medium">
                    {f.label}
                  </Label>
                  <Input
                    id={`ex-${f.key}`}
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
                <Label htmlFor="ex-w" className="text-[11px] font-medium">
                  Laize du tissu
                </Label>
                <Input
                  id="ex-w"
                  type="number"
                  value={String(measures.W)}
                  onChange={(e) => setMeasures({ ...measures, W: +e.target.value || 0 })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="ex-s" className="text-[11px] font-medium">
                  Marge de couture
                </Label>
                <Input
                  id="ex-s"
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

          <div>
            <Label htmlFor="ex-note" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Note pour les apprentis (facultative)
            </Label>
            <Textarea
              id="ex-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. Bien marquer la taille à la toile ; vérifier les crans avant d'épingler."
              className="mt-2 min-h-[64px] rounded-xl"
              maxLength={280}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => void submit()}
        disabled={!photo || !name.trim() || busy}
        size="lg"
        className="mt-5 h-12 w-full rounded-full text-[15px] font-bold shadow-lg"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
        {busy ? "Publication…" : "Publier l'exemple"}
      </Button>
    </section>
  );
}

/* Liste des exemples publiés -------------------------------------------- */

function ExampleList({
  examples,
  onDeleted,
}: {
  examples: StudioExample[];
  onDeleted: () => void;
}) {
  const remove = async (id: string, name: string) => {
    try {
      const r = await fetch(`/api/examples?id=${id}`, { method: "DELETE" });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Suppression impossible.");
      toast.success(`« ${name} » retiré de la galerie.`);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.");
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-bold">Exemples publiés</h2>
        <Badge variant="outline" className="rounded-full font-normal">
          {examples.length}
        </Badge>
      </div>
      {examples.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun exemple pour l&apos;instant — publiez le premier ci-dessus :
          il apparaîtra immédiatement dans l&apos;atelier des apprentis.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {examples.map((ex) => (
            <article
              key={ex.id}
              className="card-luxe flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-3"
            >
              <img
                src={ex.photo}
                alt={ex.name}
                className="size-24 shrink-0 rounded-xl border border-border/60 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-bold leading-tight">{ex.name}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {familyByKey(ex.family).label} · P{Math.round(ex.measures.P)} T
                      {Math.round(ex.measures.T)} H{Math.round(ex.measures.H)} · L
                      {Math.round(ex.measures.L)} cm
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void remove(ex.id, ex.name)}
                    aria-label={`Supprimer ${ex.name}`}
                    className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {ex.note && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {ex.note}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
