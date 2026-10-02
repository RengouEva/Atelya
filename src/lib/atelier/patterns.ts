/**
 * Bibliothèque de patronage — Atelier de coupe
 * Génération des pièces (chemins SVG en centimètres), placement sur le tissu,
 * méthode de coupe pas à pas et séquences d’assemblage.
 */

export type Join = "rr" | "ll" | "tt" | "rl" | "bt";

export interface PieceDef {
  /** nom de la pièce */
  n: string;
  /** chemin SVG (unités = cm) */
  d: string;
  w: number;
  h: number;
  /** nombre d’exemplaires à couper */
  q: number;
  /** pièce à couper au pli */
  fold?: boolean;
  /** remplissage even-odd (trou central, jupe mouchoir) */
  eo?: boolean;
  note?: string;
}

export interface Measures {
  P: number;
  T: number;
  H: number;
  L: number;
}

export type ModelKey =
  | "droite"
  | "cercle"
  | "mouchoir"
  | "short"
  | "tunique"
  | "blazer"
  | "manche";

export interface Model {
  n: string;
  L: number;
  g: (m: Measures) => PieceDef[];
}

/* ------------------------------------------------------------------ */
/* Briques de patronage                                                */
/* ------------------------------------------------------------------ */

const rect = (w: number, h: number) => `M0 0H${w}V${h}H0Z`;

const belt = (m: Measures): PieceDef => ({
  n: "Ceinture",
  d: rect(m.T + 4, 8),
  w: m.T + 4,
  h: 8,
  q: 1,
});

const body = (m: Measures, back: boolean, flare: number): PieceDef => {
  const cw = (m.P + 8) / 4;
  const sh = m.P * 0.21;
  const nw = 7.5;
  const nd = back ? 2.5 : 9;
  const ad = m.P / 6 + 9;
  const hm = cw + (m.L - ad) * flare;
  return {
    n: back ? "Dos" : "Devant",
    d: `M0 ${nd}Q${nw * 0.9} ${nd} ${nw} 0L${sh} 2.5Q${sh - 2} ${ad * 0.6} ${cw} ${ad}L${hm} ${m.L}H0Z`,
    w: Math.max(hm, cw),
    h: m.L,
    q: 1,
    fold: true,
  };
};

const sleeve = (m: Measures, ml: number): PieceDef => {
  const W = m.P * 0.3 + 8;
  const cap = m.P / 9;
  return {
    n: "Manche",
    d: `M0 ${cap}Q${W * 0.15} ${cap * 0.1} ${W / 2} 0Q${W * 0.85} ${cap * 0.1} ${W} ${cap}L${W - 3} ${ml}H3Z`,
    w: W,
    h: ml,
    q: 2,
  };
};

const leg = (m: Measures, b: boolean): PieceDef => {
  const hw = (m.H + 4) / 4 + (b ? 2 : 0);
  const c = m.H / 16 + (b ? 2 : 0);
  const cd = Math.min(26, m.L * 0.7);
  return {
    n: b ? "Dos" : "Devant",
    d: `M${c} 0H${c + hw - 1.5}L${c + hw} ${cd * 0.8}V${m.L}H0V${cd}Q${c - 1} ${cd * 0.85} ${c} 0Z`,
    w: c + hw,
    h: m.L,
    q: 2,
  };
};

/* ------------------------------------------------------------------ */
/* Les 7 modèles                                                       */
/* ------------------------------------------------------------------ */

export const MODELS: Record<ModelKey, Model> = {
  droite: {
    n: "Jupe droite",
    L: 60,
    g: (m) => {
      const hw = (m.H + 4) / 4;
      const tw = (m.T + 4) / 4;
      const d = `M0 0H${tw}L${hw} 20V${m.L}H0Z`;
      return [
        { n: "Devant", d, w: hw, h: m.L, q: 1, fold: true },
        { n: "Dos", d, w: hw, h: m.L, q: 1, fold: true },
        belt(m),
      ];
    },
  },
  cercle: {
    n: "Jupe cercle",
    L: 60,
    g: (m) => {
      const r = m.T / (2 * Math.PI);
      const R = r + m.L;
      return [
        {
          n: "Quart de jupe",
          d: `M${r} 0L${R} 0A${R} ${R} 0 0 1 0 ${R}L0 ${r}A${r} ${r} 0 0 0 ${r} 0Z`,
          w: R,
          h: R,
          q: 1,
          fold: true,
          note: "tissu plié en 4",
        },
        belt(m),
      ];
    },
  },
  mouchoir: {
    n: "Jupe mouchoir",
    L: 55,
    g: (m) => {
      const r = m.T / (2 * Math.PI);
      const S = (r + m.L) * 1.6;
      return [
        {
          n: "Carré",
          d: `M0 0H${S}V${S}H0Z M${S / 2 + r} ${S / 2}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0Z`,
          w: S,
          h: S,
          q: 1,
          eo: true,
        },
        belt(m),
      ];
    },
  },
  short: {
    n: "Short / pantalon",
    L: 40,
    g: (m) => [leg(m, false), leg(m, true), belt(m)],
  },
  tunique: {
    n: "Robe tunique",
    L: 95,
    g: (m) => [body(m, false, 0.15), body(m, true, 0.15)],
  },
  blazer: {
    n: "Blazer col châle",
    L: 60,
    g: (m) => {
      const o = 10;
      const t = 6;
      const cw = (m.P + 10) / 4;
      const sh = m.P * 0.21;
      const ad = m.P / 6 + 9;
      const nw = 7.5;
      const f: PieceDef = {
        n: "Devant",
        d: `M${o + nw} ${t}L${o + sh} ${t + 2.5}Q${o + sh - 2} ${t + ad * 0.6} ${o + cw} ${t + ad}L${o + cw + 1} ${t + m.L}H${o - 3}L${o - 3} ${t + ad + 4}L0 ${t + ad * 0.5}L${o + nw - 4} 0Z`,
        w: o + cw + 1,
        h: t + m.L,
        q: 2,
      };
      return [f, body({ ...m, L: m.L }, true, 0.02), sleeve(m, 58)];
    },
  },
  manche: {
    n: "Manche",
    L: 58,
    g: (m) => [sleeve(m, m.L)],
  },
};

/* ------------------------------------------------------------------ */
/* Pliage du tissu par modèle                                          */
/* ------------------------------------------------------------------ */

export const FOLD: Record<ModelKey, string> = {
  droite:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  tunique:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  blazer:
    "Pliez le tissu en deux, endroit contre endroit. Le dos se place au pli, les devants et les manches se coupent en paires miroir.",
  cercle:
    "Pliez le tissu en quatre : pliez en deux, puis encore en deux. Le coin plié sera la taille.",
  mouchoir:
    "Dépliez le tissu à plat : c’est un carré. Pliez-le en diagonale pour repérer le centre, qui sera le trou de taille.",
  short:
    "Pliez le tissu en deux, endroit contre endroit, pour couper les pièces par paires, en miroir.",
  manche:
    "Pliez le tissu en deux, endroit contre endroit, pour couper les deux manches en miroir.",
};

/* ------------------------------------------------------------------ */
/* Placement sur le tissu (algorithme de rayonnage)                    */
/* ------------------------------------------------------------------ */

export interface PlacedPiece extends PieceDef {
  id: number;
  name: string;
  /** second exemplaire d’une paire = miroir */
  mir: boolean;
  x: number;
  y: number;
}

export interface BuiltLayout {
  pieces: PlacedPiece[];
  /** largeur de tissu retenue (cm) */
  Wf: number;
  /** hauteur (métrage) du plan (cm) */
  H: number;
  /** plus grande largeur de pièce, marges comprises (cm) */
  mx: number;
  /** largeur demandée (cm) */
  raw: number;
}

export function buildLayout(
  defs: PieceDef[],
  sa: number,
  fabricWidth: number
): BuiltLayout {
  const out: PlacedPiece[] = [];
  defs.forEach((p) => {
    for (let k = 0; k < p.q; k++) {
      out.push({
        ...p,
        id: out.length,
        name: p.q > 1 ? `${p.n} ${k + 1}/${p.q}` : p.n,
        mir: p.q > 1 && k === 1,
        x: 0,
        y: 0,
      });
    }
  });
  out.sort((a, b) => b.h - a.h);

  const w0 = fabricWidth || 140;
  let x = 0;
  let y = 0;
  let rh = 0;
  let mx = 0;

  out.forEach((p) => {
    const bw = p.w + 2 * sa;
    const bh = p.h + 2 * sa;
    mx = Math.max(mx, bw);
    if (x + bw > w0 && x > 0) {
      x = 0;
      y += rh + 1;
      rh = 0;
    }
    p.x = x + sa;
    p.y = y + sa;
    x += bw + 1;
    rh = Math.max(rh, bh);
  });

  return {
    pieces: out,
    Wf: Math.max(w0, Math.ceil(mx)),
    H: Math.ceil(y + rh),
    mx,
    raw: w0,
  };
}

/** Métrage nécessaire en mètres (avec 10 cm de marge) */
export const meterage = (layout: BuiltLayout) =>
  (layout.H / 100 + 0.1).toFixed(2);

/* ------------------------------------------------------------------ */
/* Méthode de coupe pas à pas                                          */
/* ------------------------------------------------------------------ */

export function buildMethod(
  key: ModelKey,
  layout: BuiltLayout,
  defs: PieceDef[],
  sa: number
): string[] {
  return [
    "Lavez et repassez le tissu avant de couper, pour éviter qu’il rétrécisse après le montage.",
    "Repérez le droit-fil : la lisière doit rester parallèle au grand axe des pièces (flèche sur chaque pièce). Repérez l’endroit et l’envers.",
    FOLD[key],
    `Placez les pièces comme dans le schéma ci-dessus. Prévoyez ${meterage(layout)} m de tissu de ${layout.raw} cm de large.`,
    "Épinglez ou posez des poids sur chaque pièce. Gardez le papier bien à plat.",
    `Tracez la ligne de coupe à la craie, ${sa} cm autour de la ligne de couture (c’est la marge de couture).`,
    `Pièces à couper : ${defs
      .map((p) => `${p.n} ×${p.q}${p.fold ? " (au pli)" : ""}`)
      .join(", ")}.`,
    "Coupez avec de grands ciseaux, par grands coups, sans soulever le tissu de la table. Dans le schéma, touchez chaque pièce pour la couper.",
    "Avant de retirer le patron, reportez les repères : pinces, crans, milieu devant et dos.",
    "Étiquetez chaque pièce (A, B, C…) avec un bout de ruban : devant, dos, haut, bas. Passez ensuite à l’assemblage.",
  ];
}

/* ------------------------------------------------------------------ */
/* Assemblage pas à pas                                                */
/* ------------------------------------------------------------------ */

export type AsmStep = [string, string, string?, Join?];

export const ASM: Record<ModelKey, AsmStep[]> = {
  droite: [
    ["Faites les pinces de taille sur le devant et le dos.", "Devant"],
    [
      "Assemblez devant et dos sur le côté, endroit contre endroit.",
      "Devant",
      "Dos",
      "rr",
    ],
    ["Posez la ceinture sur le haut de la jupe.", "Devant", "Ceinture", "bt"],
    ["Posez la fermeture au milieu dos, puis faites l’ourlet.", "Dos"],
  ],
  cercle: [
    [
      "Rapprochez deux quarts : quatre quarts forment le cercle.",
      "Quart de jupe",
      "Quart de jupe",
      "ll",
    ],
    ["Posez la ceinture sur la taille.", "Quart de jupe", "Ceinture", "bt"],
    ["Fendez un côté pour la fermeture, puis faites l’ourlet.", "Quart de jupe"],
  ],
  mouchoir: [
    [
      "Posez la ceinture sur le trou central, qui est la taille.",
      "Carré",
      "Ceinture",
      "bt",
    ],
    ["Fendez un côté pour la fermeture, puis roulottez les bords.", "Carré"],
  ],
  short: [
    ["Assemblez les deux devants au milieu.", "Devant", "Devant", "ll"],
    ["Assemblez les deux dos de la même façon.", "Dos", "Dos", "ll"],
    ["Fermez les côtés, devant contre dos.", "Devant", "Dos", "rr"],
    [
      "Posez la ceinture avec élastique, puis faites l’ourlet.",
      "Devant",
      "Ceinture",
      "bt",
    ],
  ],
  tunique: [
    ["Assemblez les épaules, devant contre dos.", "Devant", "Dos", "tt"],
    ["Fermez les côtés jusqu’à l’emmanchure.", "Devant", "Dos", "rr"],
    [
      "Finissez l’encolure et les emmanchures avec un biais, puis l’ourlet.",
      "Devant",
    ],
  ],
  blazer: [
    ["Assemblez les épaules, devant contre dos.", "Devant", "Dos", "tt"],
    ["Piquez les côtés.", "Devant", "Dos", "rr"],
    ["Posez les manches dans les emmanchures.", "Devant", "Manche", "rl"],
    ["Rabattez les revers, posez la doublure, puis faites l’ourlet.", "Devant"],
  ],
  manche: [
    ["Fermez le dessous : les deux bords de la manche se rejoignent.", "Manche"],
    [
      "Froncez la tête de manche, montez-la dans l’emmanchure, puis faites l’ourlet.",
      "Manche",
    ],
  ],
};

export const LETTERS = "ABCDEFGH";
