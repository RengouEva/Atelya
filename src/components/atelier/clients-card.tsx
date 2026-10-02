"use client";

import * as React from "react";
import { Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Client {
  nom: string;
  P: number;
  T: number;
  H: number;
}

export function ClientsCard({
  clients,
  ready,
  selected,
  onSelect,
  name,
  onName,
  onSave,
  onDelete,
}: {
  clients: Client[] | null;
  ready: boolean;
  selected: string;
  onSelect: (v: string) => void;
  name: string;
  onName: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const has = (clients?.length ?? 0) > 0;

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
          <p className="text-xs text-muted-foreground">
            Mesures enregistrées sur cet appareil
          </p>
        </div>
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
              {clients?.map((c, i) => (
                <SelectItem key={i} value={String(i)}>
                  {c.nom} · {c.P}/{c.T}/{c.H}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
            disabled={!ready || selected === ""}
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
            placeholder="Nom pour enregistrer"
            className="h-11 flex-1 rounded-lg"
            aria-label="Nom de la cliente"
          />
          <Button
            variant="outline"
            onClick={onSave}
            className="h-11 shrink-0 rounded-lg border-primary/50 text-primary hover:bg-accent hover:text-primary"
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </section>
  );
}
