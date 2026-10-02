import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Figtree,
  Fraunces,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Atelya — Créez • Mesurez • Réalisez",
  description:
    "L'IA d'atelier : une photo, trois variantes sur mannequin, le patron complet, le plan de coupe et l'assemblage guidé.",
  keywords: [
    "Atelya",
    "stylisme",
    "modélisme",
    "patronage",
    "IA",
    "couture",
    "découpe",
    "assemblage",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/atelya-icon-192.webp",
    apple: "/atelya-icon-192.webp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f4fc" },
    { media: "(prefers-color-scheme: dark)", color: "#040b1e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${figtree.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
