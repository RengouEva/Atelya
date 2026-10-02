"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AtelierApp } from "@/components/atelier/atelier-app";
import { Landing } from "@/components/landing/landing";
import type { ModelKey } from "@/lib/atelier/patterns";

/**
 * Coquille applicative : landing ultra premium ↔ atelier de coupe.
 * Navigation par hash (#/atelier) — l'atelier se monte avec le modèle
 * choisi depuis le catalogue.
 */
export function AppShell() {
  const [view, setView] = React.useState<"landing" | "atelier">("landing");
  const [initModel, setInitModel] = React.useState<ModelKey | undefined>(
    undefined
  );

  React.useEffect(() => {
    const sync = () =>
      setView(
        window.location.hash.startsWith("#/atelier") ? "atelier" : "landing"
      );
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const open = React.useCallback((k?: ModelKey) => {
    if (k) setInitModel(k);
    window.location.hash = "#/atelier";
    window.scrollTo({ top: 0 });
  }, []);

  const home = React.useCallback(() => {
    if (window.location.hash) window.location.hash = "";
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {view === "landing" ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Landing onOpen={open} />
        </motion.div>
      ) : (
        <motion.div
          key="atelier"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AtelierApp initialModel={initModel} onHome={home} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
