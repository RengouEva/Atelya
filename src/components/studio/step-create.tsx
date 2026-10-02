"use client";

import * as React from "react";
import { ImagePlus, Loader2, Ruler, Shirt, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fileToDataUrl, urlToDataUrl } from "@/lib/studio/client";
import {
  DEFAULT_MEASURES,
  FABRIC_PRESETS,
  FAMILIES,
  type FamilyKey,
  type StudioMeasures,
} from "@/lib/studio/config";

const MEASURE_FIELDS: { key: keyof StudioMeasures; label: string; hint: string }[] = [
  { key: "P", label: "Poitrine", hint: "60–160" },
  { key: "T", label: "Taille", hint: "40–160" },
  { key: "H", label: "Hanches", hint: "60–180" },
  { key: "L", label: "Longueur", hint: "15–200" },
];

/**
 * Étape 01 — le styliste dépose la photo du modèle, choisit la famille
 * du vêtement et saisit les mesures de la cliente.
 */
export function StepCreate({
  name,
  onName,
  photo,
  onPhoto,
  family,
  onFamily,
  measures,
  onMeasures,
  busy,
  onSubmit,
}: {
  name: string;
  onName: (v: string) => void;
  photo: string | null;
  onPhoto: (v: string | null) => void;
  family: FamilyKey;
  onFamily: (f: FamilyKey) => void;
  measures: StudioMeasures;
  onMeasures: (m: StudioMeasures) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const [dropping, setDropping] = React.useState(false);
  const [loadingPhoto, setLoadingPhoto] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const takeFile = async (f: File | undefined) => {
    if (!f) return;
    setLoadingPhoto(true);
    try {
      onPhoto(await fileToDataUrl(f));
    } catch {
      /* erreur silencieuse : la zone reste prête */
    } finally {
      setLoadingPhoto(false);
    }
  };

  const takeSample = async () => {
    setLoadingPhoto(true);
    try {
      onPhoto(await urlToDataUrl("/ai/robe-ia.png"));
    } catch {
      /* idem */
    } finally {
      setLoadingPhoto(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Colonne photo */}
      <div className="flex flex-col gap-5">
        {!photo ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Déposer la photo du modèle"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropping(false);
              void takeFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "grid min-h-[320px] place-items-center rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 text-center outline-none ring-primary/50 transition focus-visible:ring-2 hover:border-primary/50",
              dropping && "border-primary bg-accent/60"
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
                {loadingPhoto ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Upload className="size-6" />
                )}
              </span>
              <p className="font-display text-lg font-bold">
                Déposez la photo du modèle
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Photo de référence du vêtement : croquis, photo magazine ou
                pièce existante. L&apos;IA la réinterprétera en 3 propositions
                portées sur mannequin.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void takeSample();
                }}
                className="mt-1 gap-1.5 rounded-full"
              >
                <ImagePlus className="size-3.5" />
                Essayer avec un exemple
              </Button>
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
            { }
            <img
              src={photo}
              alt="Photo du modèle fournie par le styliste"
              className="mx-auto max-h-[460px] w-full object-contain"
            />
            <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
              <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground">
                Photo d&apos;origine
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPhoto(null)}
                className="ml-auto gap-1 rounded-full text-xs"
              >
                <X className="size-3.5" />
                Changer
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Colonne réglages */}
      <div className="flex flex-col gap-5">
        <div className="card-luxe rounded-2xl border border-border/70 bg-card p-5">
          <Label htmlFor="pj-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Nom du projet
          </Label>
          <Input
            id="pj-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Ex. Robe cocktail — Mme Léa"
            className="mt-2 rounded-xl"
            maxLength={60}
          />

          <p className="mt-5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Famille du vêtement
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Famille du vêtement">
            {FAMILIES.map((f) => (
              <button
                key={f.key}
                role="radio"
                aria-checked={family === f.key}
                onClick={() => onFamily(f.key)}
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
          <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Shirt className="size-3.5 shrink-0" />
            La famille guide le tracé du patron ; l&apos;IA garde le style de
            votre photo.
          </p>
        </div>

        <div className="card-luxe rounded-2xl border border-border/70 bg-card p-5">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Ruler className="size-3.5" />
            Mesures de la cliente (cm)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {MEASURE_FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`ms-${f.key}`} className="text-xs font-medium">
                  {f.label} <span className="text-muted-foreground">· {f.hint}</span>
                </Label>
                <Input
                  id={`ms-${f.key}`}
                  type="number"
                  inputMode="numeric"
                  value={String(measures[f.key])}
                  onChange={(e) =>
                    onMeasures({ ...measures, [f.key]: +e.target.value || 0 })
                  }
                  className="mt-1.5 rounded-xl"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ms-w" className="text-xs font-medium">
                Laize du tissu
              </Label>
              <Input
                id="ms-w"
                type="number"
                value={String(measures.W)}
                onChange={(e) => onMeasures({ ...measures, W: +e.target.value || 0 })}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="ms-s" className="text-xs font-medium">
                Marge de couture
              </Label>
              <Input
                id="ms-s"
                type="number"
                step="0.5"
                value={String(measures.S)}
                onChange={(e) => onMeasures({ ...measures, S: +e.target.value || 0 })}
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
            Coloris du tissu
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FABRIC_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => onMeasures({ ...measures, C: c })}
                aria-label={`Coloris ${c}`}
                aria-pressed={measures.C === c}
                className={cn(
                  "size-7 rounded-full border-2 outline-none ring-primary/50 transition focus-visible:ring-2",
                  measures.C === c
                    ? "border-foreground shadow-md"
                    : "border-transparent hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="grid size-7 cursor-pointer place-items-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground"
              title="Coloris personnalisé"
            >
              +
              <input
                type="color"
                value={measures.C}
                onChange={(e) => onMeasures({ ...measures, C: e.target.value })}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={!photo || !name.trim() || busy}
          size="lg"
          className="h-12 rounded-xl text-[15px] shadow-md"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Création du projet…" : "Générer les 3 variantes IA"}
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Comptez 30 à 90 secondes pour les trois propositions — elles sont
          ensuite conservées avec le projet.
        </p>
      </div>
    </div>
  );
}
