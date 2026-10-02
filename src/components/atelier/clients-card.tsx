"use client";

import * as React from "react";
import { Database, Loader2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Fiche cliente renvoyée par l'API /api/clients */
export interface ApiClient {
  id: string;
  name: string;
  P: number;
  T: number;
  H: number;
  L: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ClientsCard({
  clients,
  ready,
  busy,
  selected,
  onSelect,
  name,
  onName,
  onSave,
  onDelete,
}: {
  clients: ApiClient[] | null;
  ready: boolean;
  busy: boolean;
  selected: string;
  onSelect: (v: string) => void;
  name: string;
  onName: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const has = (clients?.length ?? 0) > 0;
  const isUpdate = selected !== "";

  return (
    <section
      aria-label="Fiches clientes"
      className="card-luxe rounded-2xl border border-border/70 bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <Users className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold leading-tight">
            Clientes
          </h2>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="size-3" />
            Mesures conservées en base de données
          </p>
        </div>
        {busy && (
          <Loader2 className="ml-auto size-4 shrink-0 animate-spin text-muted-foreground" />
        )}
      </header>

      <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
        <div className="flex gap-2">
          <Select
            value={selected}
            onValueChange={onSelect}
            disabled={!ready || !has}
          >
            <SelectTrigger className="h-11 flex-1 rounded-lg">
              <SelectValue
                placeholder={has ? "Choisir une fiche…" : "Aucune fiche"}
              />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {Math.round(c.P)}/{Math.round(c.T)}/
                  {Math.round(c.H)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
            disabled={!ready || !isUpdate || busy}
            onClick={onDelete}
            aria-label="Supprimer la fiche sélectionnée"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => onName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
            }}
            placeholder={isUpdate ? "Modifier le nom…" : "Nom pour enregistrer"}
            className="h-11 flex-1 rounded-lg"
            aria-label="Nom de la cliente"
          />
          <Button
            variant="outline"
            onClick={onSave}
            disabled={busy}
            className="h-11 shrink-0 rounded-lg border-primary/50 text-primary hover:bg-accent hover:text-primary"
          >
            {isUpdate ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {isUpdate
            ? "La fiche sélectionnée sera mise à jour avec les mesures affichées."
            : "Enregistrez P, T, H et L courants sous le nom de votre cliente."}
        </p>
      </div>
    </section>
  );
}
