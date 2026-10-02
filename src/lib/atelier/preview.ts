/**
 * Moteur d'aperçu vêtement — silhouettes paramétriques
 * Chaque modèle est dessiné « à plat » (développé sur moitié de tour),
 * à l'échelle des mesures réelles P (poitrine), T (taille), H (hanches), L (longueur).
 * Toutes les coordonnées sont en cm, centrées sur x = 0.
 */

import { MODELS, type Measures, type ModelKey } from "@/lib/atelier/patterns";

export interface PreviewPart {
  d: string;
  fill?: string;
  /** opacité du remplissage */
  fo?: number;
  stroke?: string;
  sw?: number;
  so?: number;
  dash?: string;
  /** ligne (ignorer le remplissage) */
  line?: boolean;
  cap?: "round" | "butt";
}

export interface PreviewSpec {
  /** largeur de la boîte englobante (cm) */
  w: number;
  /** hauteur totale (cm), y va de y0 à h */
  h: number;
  /** bord supérieur (négatif si ceinture au-dessus) */
  y0: number;
  parts: PreviewPart[];
}

/* ------------------------------------------------------------------ */
/* Utilitaires couleur & nombres                                       */
/* ------------------------------------------------------------------ */

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Assombrit (f < 0) ou éclaircit (f > 0) une couleur hex */
export function shade(hex: string, f: number): string {
  const m = hex.replace("#", "");
  const n =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0);
  const out = rgb.map((c) =>
    Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f)
      .toString(16)
      .padStart(2, "0")
  );
  return `#${out.join("")}`;
}

const INK = "#232B45";

export const DEFAULT_M: Measures = { P: 90, T: 70, H: 98, L: 60 };

export const previewMeasures = (key: ModelKey): Measures => ({
  ...DEFAULT_M,
  L: MODELS[key].L,
});

/* ------------------------------------------------------------------ */
/* Jupe générique                                                      */
/* ------------------------------------------------------------------ */

interface SkirtOpts {
  flare: number;
  band?: boolean;
  bandW?: number;
  slit?: boolean;
  wrap?: boolean;
  pleats?: boolean;
  drape?: boolean;
}

function skirtParts(m: Measures, fc: string, o: SkirtOpts): PreviewSpec {
  const L = clamp(m.L, 20, 150);
  /* vue de face = moitié du tour : quarts de circonférence */
  const ww = m.T / 4 + 1;
  const hw = m.H / 4 + 1.5;
  const hipY = Math.min(22, L * 0.3);
  const hem = Math.max(hw, ww + (hw - ww) * 0.3 + (L - hipY) * o.flare);
  const dip = clamp(2 + o.flare * 7, 2, 9);
  const sd = shade(fc, -0.22);
  const y0 = o.band === false ? 0 : -8;

  const parts: PreviewPart[] = [];

  // Ceinture
  if (o.band !== false) {
    const bw = o.bandW ?? ww + 1;
    parts.push({
      d: `M${r1(-bw)} -8H${r1(bw)}V0H${r1(-bw)}Z`,
      fill: sd,
      stroke: INK,
      so: 0.5,
      sw: 0.35,
    });
    parts.push({
      d: `M${r1(-bw * 0.55)} -8V0`,
      line: true,
      stroke: "#fff",
      so: 0.45,
      sw: 0.45,
      cap: "round",
    });
  }

  // Corps de jupe
  parts.push({
    d: `M${r1(-ww)} 0L${r1(ww)} 0C${r1(ww * 0.98)} ${r1(hipY * 0.4)} ${r1(hw)} ${r1(hipY * 0.62)} ${r1(hw)} ${r1(hipY)}L${r1(hem / 2)} ${r1(L)}Q0 ${r1(L + dip)} ${r1(-hem / 2)} ${r1(L)}Z`,
    fill: fc,
    stroke: INK,
    so: 0.5,
    sw: 0.35,
  });

  // Ligne de croisée (portefeuille)
  if (o.wrap) {
    parts.push({
      d: `M${r1(ww * 0.1)} ${r1(hipY * 0.9)}L${r1(hem * 0.34)} ${r1(L + dip * 0.5)}`,
      line: true,
      stroke: sd,
      so: 0.9,
      sw: 0.9,
      cap: "round",
    });
    // liens qui tombent
    parts.push({
      d: `M-1.5 1C-6 ${L * 0.3} -8 ${L * 0.55} -6.5 ${L * 0.62}`,
      line: true,
      stroke: sd,
      so: 0.85,
      sw: 2.6,
      cap: "round",
    });
    parts.push({
      d: `M1.5 1C7 ${L * 0.34} 9 ${L * 0.6} 7.5 ${L * 0.7}`,
      line: true,
      stroke: shade(fc, -0.32),
      so: 0.85,
      sw: 2.6,
      cap: "round",
    });
  }

  // Plis
  if (o.pleats) {
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      parts.push({
        d: `M${r1(-ww + 2 * ww * t)} 0L${r1(-hem / 2 + hem * t)} ${r1(L)}`,
        line: true,
        stroke: "#fff",
        so: 0.4,
        sw: 0.5,
      });
    }
  } else if (o.drape !== false) {
    // drapé discret
    for (const t of [0.3, 0.5, 0.7]) {
      parts.push({
        d: `M${r1(-ww + 2 * ww * t)} ${r1(hipY)}C${r1(-hem * (t - 0.5) * 0.9)} ${r1(L * 0.55)} ${r1(-hem * (t - 0.5) * 0.7)} ${r1(L * 0.8)} ${r1(-hem * (t - 0.5) * 0.55)} ${r1(L - 2)}`,
        line: true,
        stroke: "#fff",
        so: 0.32,
        sw: 0.6,
        cap: "round",
      });
    }
  }

  // Fente (crayon)
  if (o.slit) {
    parts.push({
      d: `M0 ${r1(L * 0.52)}L0 ${r1(L - 1)}`,
      line: true,
      stroke: sd,
      so: 0.95,
      sw: 0.8,
      cap: "round",
    });
    parts.push({
      d: `M0 ${r1(L * 0.52)}l1.2 1.4`,
      line: true,
      stroke: sd,
      so: 0.7,
      sw: 0.5,
    });
  }

  return { w: Math.max(hem, ww * 2, 30), h: L, y0, parts };
}

/* ------------------------------------------------------------------ */
/* Jupe cercle & mouchoir                                              */
/* ------------------------------------------------------------------ */

function circleParts(m: Measures, fc: string): PreviewSpec {
  const L = clamp(m.L, 25, 150);
  const ww = m.T / 4 + 1;
  const hem = Math.max(L * 0.95, ww * 1.7);
  const dip = L * 0.16;
  const sd = shade(fc, -0.22);
  return {
    w: hem,
    h: L,
    y0: -8,
    parts: [
      {
        d: `M${r1(-ww)} -8H${r1(ww)}V0H${r1(-ww)}Z`,
        fill: sd,
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      },
      {
        d: `M${r1(-ww)} 0C${r1(-ww)} ${r1(L * 0.45)} ${r1(-hem / 2)} ${r1(L * 0.55)} ${r1(-hem / 2)} ${r1(L)}Q0 ${r1(L + dip)} ${r1(hem / 2)} ${r1(L)}C${r1(hem / 2)} ${r1(L * 0.55)} ${r1(ww)} ${r1(L * 0.45)} ${r1(ww)} 0Z`,
        fill: fc,
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      },
      {
        d: `M${r1(-ww * 0.55)} ${r1(L * 0.25)}C${r1(-hem * 0.22)} ${r1(L * 0.5)} ${r1(-hem * 0.2)} ${r1(L * 0.75)} ${r1(-hem * 0.17)} ${r1(L - 2)}`,
        line: true,
        stroke: "#fff",
        so: 0.35,
        sw: 0.6,
        cap: "round",
      },
      {
        d: `M${r1(ww * 0.55)} ${r1(L * 0.25)}C${r1(hem * 0.22)} ${r1(L * 0.5)} ${r1(hem * 0.2)} ${r1(L * 0.75)} ${r1(hem * 0.17)} ${r1(L - 2)}`,
        line: true,
        stroke: "#fff",
        so: 0.35,
        sw: 0.6,
        cap: "round",
      },
    ],
  };
}

function handkerchiefParts(m: Measures, fc: string): PreviewSpec {
  const L = clamp(m.L, 30, 150);
  const s = L * 0.62;
  const hole = m.T / 6 + 1.5;
  const sd = shade(fc, -0.22);
  const parts: PreviewPart[] = [
    {
      d: `M0 0L${r1(s)} ${r1(s)}L0 ${r1(2 * s)}L${r1(-s)} ${r1(s)}Z`,
      fill: fc,
      stroke: INK,
      so: 0.5,
      sw: 0.35,
    },
    // trou de taille
    {
      d: `M${r1(-hole)} ${r1(s)}a${r1(hole)} ${r1(hole * 0.5)} 0 1 0 ${r1(2 * hole)} 0a${r1(hole)} ${r1(hole * 0.5)} 0 1 0 ${r1(-2 * hole)} 0Z`,
      fill: "#000",
      fo: 0.14,
      stroke: sd,
      so: 0.8,
      sw: 0.5,
    },
    // drapé vers les pointes
  ];
  for (const [dx, dy] of [
    [1, 1],
    [-1, 1],
  ] as const) {
    parts.push({
      d: `M${r1(dx * hole * 0.7)} ${r1(s + dy * hole * 0.28)}L${r1(dx * s * 0.82)} ${r1(s + dy * s * 0.82)}`,
      line: true,
      stroke: "#fff",
      so: 0.35,
      sw: 0.55,
      cap: "round",
    });
  }
  // ceinture plate
  parts.push({
    d: `M${r1(-hole * 1.5)} ${r1(s - 2.4)}h${r1(hole * 3)}v4.8h${r1(-hole * 3)}Z`,
    fill: sd,
    stroke: INK,
    so: 0.5,
    sw: 0.3,
  });
  return { w: 2 * s, h: 2 * s, y0: 0, parts };
}

/* ------------------------------------------------------------------ */
/* Pantalon / short                                                    */
/* ------------------------------------------------------------------ */

function pantsParts(m: Measures, fc: string, op: number): PreviewSpec {
  const L = clamp(m.L, 18, 130);
  const ww = m.T / 4 + 1;
  const hw = m.H / 4 + 1.5;
  const cd = clamp(L * 0.42, 14, 27);
  const hemOut = Math.max(hw * 0.52 + op * 0.55, hw * 0.5);
  const hemIn = Math.max(2.5, hemOut - op);
  const sd = shade(fc, -0.22);

  const side = (s: 1 | -1) =>
    `M${r1(s * ww)} 0C${r1(s * (ww + 1.5))} ${r1(cd * 0.3)} ${r1(s * hw)} ${r1(cd * 0.55)} ${r1(s * hw)} ${r1(cd * 0.78)}C${r1(s * hw)} ${r1(cd * 0.95)} ${r1(s * hemOut)} ${r1(L * 0.78)} ${r1(s * hemOut)} ${r1(L)}L${r1(s * hemIn)} ${r1(L)}C${r1(s * hemIn * 0.7)} ${r1(L * 0.84)} ${r1(s * (hw * 0.22 + hemIn * 0.3))} ${r1(cd * 1.12)} 0 ${r1(cd)}`;

  const d = `${side(-1)}C${r1(hw * 0.22 + hemIn * 0.3)} ${r1(cd * 1.12)} ${r1(hemIn * 0.7)} ${r1(L * 0.84)} ${r1(hemIn)} ${r1(L)}L${r1(hemOut)} ${r1(L)}C${r1(hemOut)} ${r1(L * 0.78)} ${r1(hw)} ${r1(cd * 0.95)} ${r1(hw)} ${r1(cd * 0.78)}C${r1(hw)} ${r1(cd * 0.55)} ${r1(ww + 1.5)} ${r1(cd * 0.3)} ${r1(ww)} 0Z`;

  const parts: PreviewPart[] = [
    {
      d: `M${r1(-ww)} -8H${r1(ww)}V0H${r1(-ww)}Z`,
      fill: sd,
      stroke: INK,
      so: 0.5,
      sw: 0.35,
    },
    { d, fill: fc, stroke: INK, so: 0.5, sw: 0.35 },
    // fourche
    {
      d: `M0 ${r1(cd)}V${r1(-1)}`,
      line: true,
      stroke: sd,
      so: 0.55,
      sw: 0.5,
    },
  ];

  // lignes de repassage
  for (const s of [1, -1]) {
    parts.push({
      d: `M${r1(s * hw * 0.45)} ${r1(cd * 0.9)}L${r1(s * ((hemIn + hemOut) / 2))} ${r1(L - 1.5)}`,
      line: true,
      stroke: "#fff",
      so: 0.38,
      sw: 0.5,
      cap: "round",
    });
  }

  return { w: Math.max(hemOut * 2, ww * 2, 26), h: L, y0: -8, parts };
}

/* ------------------------------------------------------------------ */
/* Haut / robe                                                         */
/* ------------------------------------------------------------------ */

interface TopOpts {
  flare: number;
  ml?: number;
  /** évasement de manche */
  sfl?: number;
  /** angle de manche en degrés */
  sang?: number;
  nd?: number;
  straps?: boolean;
  buttons?: boolean;
  lapel?: boolean;
  pockets?: boolean;
  drape?: boolean;
}

function topParts(m: Measures, fc: string, o: TopOpts): PreviewSpec {
  const L = clamp(m.L, 25, 150);
  const nd = o.nd ?? 9;
  const ad = m.P / 6 + 8;
  const cw = m.P / 4 + 2.5;
  const sw = o.straps ? 9 : m.P * 0.36;
  const hem = Math.max(cw, cw + (L - ad) * o.flare);
  const sd = shade(fc, -0.22);
  const sx2 = shade(fc, 0.25);

  const parts: PreviewPart[] = [];

  // Manches (dessinées derrière le corps)
  if (o.ml) {
    const a = ((o.sang ?? 22) * Math.PI) / 180;
    const ux = Math.sin(a);
    const uy = Math.cos(a);
    const wTop = 7.5;
    const wBot = 7.5 + (o.sfl ?? 0) + (o.ml < 26 ? 1 : 0);
    for (const s of [1, -1] as const) {
      const Sx = s * (sw / 2 - 0.5);
      const Sy = 2.5;
      const Ex = Sx + s * ux * o.ml;
      const Ey = Sy + uy * o.ml;
      const px = uy;
      const py = -s * ux;
      const cap = m.P / 12;
      parts.push({
        d: `M${r1(Sx + px * wTop)} ${r1(Sy + py * wTop)}Q${r1(Sx - s * ux * cap * 1.6)} ${r1(Sy - uy * cap * 1.6)} ${r1(Sx - px * wTop)} ${r1(Sy - py * wTop)}L${r1(Ex - px * wBot)} ${r1(Ey - py * wBot)}L${r1(Ex + px * wBot)} ${r1(Ey + py * wBot)}Z`,
        fill: shade(fc, -0.08),
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      });
      // ourlet manche
      parts.push({
        d: `M${r1(Ex - px * wBot)} ${r1(Ey - py * wBot)}L${r1(Ex + px * wBot)} ${r1(Ey + py * wBot)}`,
        line: true,
        stroke: sx2,
        so: 0.8,
        sw: 0.7,
      });
    }
  }

  // Corps
  const shoulder = (s: 1 | -1) => {
    if (o.straps) return `L${r1(s * 4.5)} 0`;
    return `L${r1(s * (sw / 2))} 1.5`;
  };
  const armscye = (s: 1 | -1) => {
    const tipX = o.straps ? 4.5 : sw / 2;
    const ctrlX = cw - (o.straps ? 4 : 2);
    const ctrlY = ad * (o.straps ? 0.7 : 0.55);
    return `Q${r1(s * ctrlX)} ${r1(ctrlY)} ${r1(s * cw)} ${r1(ad)}`;
  };
  const neck = o.straps
    ? `M${r1(-4.5)} 0Q0 ${r1(nd * 0.5)} ${r1(4.5)} 0`
    : `M${r1(-7)} 0Q0 ${r1(nd)} ${r1(7)} 0`;

  const body = `${neck}${shoulder(1)}${armscye(1)}L${r1(hem)} ${r1(L)}Q0 ${r1(L + 3)} ${r1(-hem)} ${r1(L)}${`L${r1(-cw)} ${r1(ad)}`}${armscye(-1)}${shoulder(-1)}Z`;

  parts.push({ d: body, fill: fc, stroke: INK, so: 0.5, sw: 0.35 });

  // Encolure soulignée
  parts.push({
    d: neck.replace("M", "M").replace("Q", "Q"),
    line: true,
    stroke: sd,
    so: 0.85,
    sw: 0.8,
    cap: "round",
  });

  // Col châle + boutonnière (blazer)
  if (o.lapel) {
    parts.push({
      d: `M-7 0C-11 6 -10 ${r1(L * 0.22)} -2.2 ${r1(L * 0.34)}L2.2 ${r1(L * 0.34)}C10 ${r1(L * 0.22)} 11 6 7 0C4 ${r1(nd + 2)} -4 ${r1(nd + 2)} -7 0Z`,
      fill: sd,
      fo: 0.92,
      stroke: INK,
      so: 0.5,
      sw: 0.35,
    });
    parts.push({
      d: `M0 ${r1(L * 0.34)}V${r1(L - 2)}`,
      line: true,
      stroke: sd,
      so: 0.9,
      sw: 0.7,
    });
    if (o.buttons) {
      for (const t of [0.46, 0.58, 0.7, 0.82]) {
        parts.push({
          d: `M0 ${r1(L * t)}l0 0.01`,
          line: true,
          stroke: sx2,
          so: 1,
          sw: 1.6,
          cap: "round",
        });
      }
    }
  }

  // Poches (blazer)
  if (o.pockets) {
    for (const s of [1, -1] as const) {
      const y = L * 0.52;
      const x = s * (cw * 0.52);
      parts.push({
        d: `M${r1(x - s * 0.5)} ${r1(y)}h${r1(s * 7)}l${r1(-s * 1.2)} 3.4h${r1(-s * 4.6)}Z`,
        fill: sd,
        fo: 0.85,
        stroke: INK,
        so: 0.4,
        sw: 0.3,
      });
    }
  }

  // Drapé
  if (o.drape !== false && !o.lapel) {
    for (const t of [0.36, 0.64]) {
      parts.push({
        d: `M${r1(-cw + 2 * cw * t)} ${r1(ad + 3)}C${r1(-hem * (t - 0.5) * 1.1)} ${r1(L * 0.55)} ${r1(-hem * (t - 0.5) * 0.85)} ${r1(L * 0.8)} ${r1(-hem * (t - 0.5) * 0.6)} ${r1(L - 2)}`,
        line: true,
        stroke: "#fff",
        so: 0.3,
        sw: 0.6,
        cap: "round",
      });
    }
  }

  return { w: Math.max(hem * 2, cw * 2, sw + 2 * (o.ml ?? 0) * 0.6, 26), h: L, y0: 0, parts };
}

/* ------------------------------------------------------------------ */
/* Kimono                                                              */
/* ------------------------------------------------------------------ */

function kimonoParts(m: Measures, fc: string): PreviewSpec {
  const L = clamp(m.L, 50, 150);
  const sw = m.P * 0.36;
  const arm = m.P * 0.26;
  const sd = clamp(m.P * 0.5, 38, 52);
  const cw = m.P / 4 + 5;
  const hem = cw + (L - sd) * 0.18;
  const sd2 = shade(fc, -0.22);
  const waistY = L * 0.52;

  return {
    w: 2 * (sw / 2 + arm),
    h: L,
    y0: 0,
    parts: [
      {
        d: `M${r1(-sw / 2)} 0L${r1(sw / 2)} 0L${r1(sw / 2 + arm)} 2V${r1(sd)}L${r1(cw)} ${r1(sd + 4)}L${r1(hem)} ${r1(L)}L${r1(-hem)} ${r1(L)}L${r1(-cw)} ${r1(sd + 4)}L${r1(-(sw / 2 + arm))} ${r1(sd)}V2Z`,
        fill: fc,
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      },
      // croisé + col
      {
        d: `M-3 ${r1(3)}L0 ${r1(10)}L3 ${r1(3)}`,
        line: true,
        stroke: sd2,
        so: 0.9,
        sw: 1,
        cap: "round",
      },
      {
        d: `M3 ${r1(6)}V${r1(L - 2)}`,
        line: true,
        stroke: sd2,
        so: 0.9,
        sw: 0.9,
      },
      // ceinture
      {
        d: `M${r1(-hem + 1)} ${r1(waistY)}h${r1(2 * hem - 2)}v7h${r1(-2 * hem + 2)}Z`,
        fill: sd2,
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      },
      {
        d: `M-2.4 ${r1(waistY)}h4.8v7h-4.8Z`,
        fill: shade(fc, -0.34),
        stroke: INK,
        so: 0.4,
        sw: 0.3,
      },
      {
        d: `M-1.6 ${r1(waistY + 7)}l-1.4 ${r1(L * 0.2)}l2.2 0.4l1 ${r1(-L * 0.2)}`,
        fill: shade(fc, -0.34),
        fo: 0.9,
        stroke: INK,
        so: 0.35,
        sw: 0.3,
      },
      // drapé manches
      {
        d: `M${r1(sw / 2 + arm * 0.3)} 3V${r1(sd - 3)}`,
        line: true,
        stroke: "#fff",
        so: 0.35,
        sw: 0.55,
      },
      {
        d: `M${r1(-(sw / 2 + arm * 0.3))} 3V${r1(sd - 3)}`,
        line: true,
        stroke: "#fff",
        so: 0.35,
        sw: 0.55,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Étude de manche                                                     */
/* ------------------------------------------------------------------ */

function sleeveStudyParts(m: Measures, fc: string): PreviewSpec {
  const L = clamp(m.L, 20, 100);
  const W = m.P * 0.3 + 8;
  const cap = m.P / 9;
  const sd = shade(fc, -0.22);
  return {
    w: W,
    h: L,
    y0: 0,
    parts: [
      {
        d: `M${r1(-W / 2)} ${r1(cap)}Q${r1(-W * 0.35)} ${r1(cap * 0.1)} 0 0Q${r1(W * 0.35)} ${r1(cap * 0.1)} ${r1(W / 2)} ${r1(cap)}L${r1(W / 2 - 3)} ${r1(L)}H${r1(-W / 2 + 3)}Z`,
        fill: fc,
        stroke: INK,
        so: 0.5,
        sw: 0.35,
      },
      // fronces de la tête
      ...[0.2, 0.35, 0.5, 0.65, 0.8].map<PreviewPart>((t) => ({
        d: `M${r1(-W / 2 + W * t)} ${r1(cap * 0.16)}V${r1(cap * 0.55)}`,
        line: true,
        stroke: sxSafe(fc),
        so: 0.7,
        sw: 0.45,
        cap: "round",
      })),
      {
        d: `M${r1(-W / 2 + 3)} ${r1(L - 2.5)}H${r1(W / 2 - 3)}`,
        line: true,
        stroke: sd,
        so: 0.85,
        sw: 0.7,
      },
    ],
  };
}

function sxSafe(fc: string) {
  return shade(fc, 0.3);
}

/* ------------------------------------------------------------------ */
/* Dispatch par modèle                                                 */
/* ------------------------------------------------------------------ */

export function garmentPreview(
  m: Measures,
  key: ModelKey,
  fc: string
): PreviewSpec {
  switch (key) {
    case "droite":
      return skirtParts(m, fc, { flare: 0.18 });
    case "crayon":
      return skirtParts(m, fc, { flare: -0.06, slit: true });
    case "evasee":
      return skirtParts(m, fc, { flare: 0.55 });
    case "cercle":
      return circleParts(m, fc);
    case "mouchoir":
      return handkerchiefParts(m, fc);
    case "portefeuille":
      return skirtParts(m, fc, { flare: 0.5, wrap: true, drape: false });
    case "plissee":
      return skirtParts(m, fc, { flare: 0.12, pleats: true, drape: false });
    case "short":
      return pantsParts(m, fc, 12.5);
    case "pantalon":
      return pantsParts(m, fc, 10);
    case "large":
      return pantsParts(m, fc, 17);
    case "tshirt":
      return topParts(m, fc, { flare: 0.06, ml: 20, sang: 34, nd: 9 });
    case "tunique":
      return topParts(m, fc, { flare: 0.25, nd: 6 });
    case "blouse":
      return topParts(m, fc, { flare: 0.45, ml: 55, sfl: 4, nd: 9 });
    case "robe":
      return topParts(m, fc, { flare: 0.38, straps: true, nd: 5 });
    case "blazer":
      return topParts(m, fc, {
        flare: 0.05,
        ml: 58,
        nd: 7,
        lapel: true,
        buttons: true,
        pockets: true,
        drape: false,
      });
    case "kimono":
      return kimonoParts(m, fc);
    case "manche":
      return sleeveStudyParts(m, fc);
    default:
      return skirtParts(m, fc, { flare: 0.18 });
  }
}
