"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { StudioApp } from "@/components/studio/studio-app";
import { Landing } from "@/components/landing/landing";

/**
 * Coquille applicative : landing premium ↔ studio du styliste.
 * Navigation par hash (#/studio) — le studio se monte prêt à recevoir
 * la photo du modèle.
 */
export function AppShell() {
  const [view, setView] = React.useState<"landing" | "studio">("landing");

  React.useEffect(() => {
    const sync = () =>
      setView(
        window.location.hash.startsWith("#/studio") ||
          window.location.hash.startsWith("#/atelier")
          ? "studio"
          : "landing"
      );
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const open = React.useCallback(() => {
    window.location.hash = "#/studio";
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
          key="studio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <StudioApp onHome={home} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
