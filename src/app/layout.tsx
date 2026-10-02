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
  title: "Atelier de coupe — patronage, plan de coupe & assemblage",
  description:
    "Choisissez un modèle, entrez les mesures : les pièces sont placées sur le tissu, la méthode de coupe pas à pas et l’assemblage animé s’affichent. Un atelier de couture complet, du tissu à la pièce finie.",
  keywords: [
    "couture",
    "patronage",
    "coupe du tissu",
    "jupe",
    "blazer",
    "atelier",
    "assemblage",
  ],
  icons: {
    icon: "/scissors.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0e9" },
    { media: "(prefers-color-scheme: dark)", color: "#12162a" },
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
