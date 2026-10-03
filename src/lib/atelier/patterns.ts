/**
 * Bibliothèque de patronage — Atelier de coupe
 * Génération des pièces (chemins SVG en centimètres), placement sur le tissu,
 * méthode de coupe pas à pas et séquences d'assemblage.
 * 17 modèles paramétriques calculés sur les mesures P·T·H·L.
 */

export interface PieceDef {
  /** nom de la pièce */
  n: string;
  /** chemin SVG (unités = cm) */
  d: string;
  w: number;
  h: number;
  /** nombre d'exemplaires à couper */
  q: number;
  /** pièce à couper au pli */
  fold?: boolean;
  /** le pli est au milieu de la pièce (devant de pantalon entier) */
  foldMid?: boolean;
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
  | "crayon"
  | "evasee"
  | "cercle"
  | "mouchoir"
  | "portefeuille"
  | "plissee"
  | "short"
  | "pantalon"
  | "large"
  | "tshirt"
  | "tunique"
  | "blouse"
  | "robe"
  | "blazer"
  | "kimono"
  | "manche";

export type CatKey = "jupes" | "pantalons" | "hauts" | "vestes" | "bases";

export const CATS: Record<CatKey, string> = {
  jupes: "Jupes",
  pantalons: "Pantalons",
  hauts: "Hauts",
  vestes: "Vestes & robes",
  bases: "Bases & études",
};

export const CAT_ORDER: CatKey[] = [
  "jupes",
  "pantalons",
  "hauts",
  "vestes",
  "bases",
];

export interface Model {
  n: string;
  L: number;
  cat: CatKey;
  desc: string;
  tags: string[];
  diff: 1 | 2 | 3;
  fab: string;
  g: (m: Measures) => PieceDef[];
}

/* ------------------------------------------------------------------ */
/* Briques de patronage                                                */
/* ------------------------------------------------------------------ */

const rect = (w: number, h: number) => `M0 0H${w}V${h}H0Z`;

const belt = (m: Measures, ext = 4): PieceDef => ({
  n: "Ceinture",
  d: rect(m.T + ext, 8),
  w: m.T + ext,
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

const sleeve = (m: Measures, ml: number, fl = 0): PieceDef => {
  const W = m.P * 0.3 + 8;
  const cap = m.P / 9;
  const hb = Math.max(2, 3 - fl);
  return {
    n: "Manche",
    d: `M0 ${cap}Q${W * 0.15} ${cap * 0.1} ${W / 2} 0Q${W * 0.85} ${cap * 0.1} ${W} ${cap}L${W - 3 + fl} ${ml}H${hb}Z`,
    w: Math.max(W, W - 3 + fl),
    h: ml,
    q: 2,
  };
};

/** Panneau de jupe : courbe de hanches puis évasement (flare négatif = crayon) */
const skirtPanel = (m: Measures, back: boolean, flare: number): PieceDef => {
  const hw = (m.H + 4) / 4 + (back ? 1 : 0);
  const tw = (m.T + 4) / 4;
  const hipY = Math.min(22, m.L * 0.35);
  const hem = hw + (m.L - hipY) * flare;
  return {
    n: back ? "Dos" : "Devant",
    d: `M0 0H${tw}C${tw + (hw - tw) * 0.25} ${hipY * 0.4} ${hw - (hw - tw) * 0.1} ${hipY * 0.75} ${hw} ${hipY}L${hem} ${m.L}H0Z`,
    w: Math.max(hem, hw),
    h: m.L,
    q: 1,
    fold: true,
  };
};

/** Devant de pantalon ENTIER, coupé au pli : les deux jambes d'une seule tenue,
 *  creux de fourche au milieu. Aucune couture au milieu devant. */
const pantsFrontFold = (m: Measures, wide = 0): PieceDef => {
  const hw = (m.H + 4) / 4;
  const tw = (m.T + 4) / 4;
  const cd = Math.min(26, m.L * 0.7);
  const sp = wide * Math.max(0, m.L * 0.16);
  const hipY = Math.min(22, m.L * 0.35);
  const fork = Math.max(4, m.H / 16);
  const W = hw + sp; // demi-largeur
  const O = W; // décalage : la pièce est dessinée de x=0 à x=2W, pli au centre
  return {
    n: "Devant",
    d: [
      `M${-tw + O} 0`,
      `H${tw + O}`,
      `C${tw + (hw - tw) * 0.25 + O} ${hipY * 0.4} ${hw - (hw - tw) * 0.1 + O} ${hipY * 0.75} ${hw + O} ${hipY}`,
      `L${W + O} ${m.L}`,
      `H${fork + O}`,
      `L${O} ${cd}`,
      `L${-fork + O} ${m.L}`,
      `H${-W + O}`,
      `L${-hw + O} ${hipY}`,
      `C${-hw + (hw - tw) * 0.1 + O} ${hipY * 0.75} ${-tw - (hw - tw) * 0.25 + O} ${hipY * 0.4} ${-tw + O} 0`,
      "Z",
    ].join(""),
    w: 2 * W,
    h: m.L,
    q: 1,
    fold: true,
    foldMid: true,
    note: "au pli : les 2 jambes",
  };
};

/** Jambe de pantalon / short (dos) — (wide = évasement de l'ourlet) */
const leg = (m: Measures, b: boolean, wide = 0): PieceDef => {
  const hw = (m.H + 4) / 4 + (b ? 2 : 0);
  const c = m.H / 16 + (b ? 2 : 0);
  const cd = Math.min(26, m.L * 0.7);
  const sp = wide * Math.max(0, m.L * 0.16);
  return {
    n: b ? "Dos" : "Devant",
    d: `M${c} 0H${c + hw - 1.5}L${c + hw} ${cd * 0.8}L${c + hw + sp} ${m.L}H0V${cd}Q${c - 1} ${cd * 0.85} ${c} 0Z`,
    w: c + hw + sp,
    h: m.L,
    q: 2,
  };
};

/** Panneau plissé : la profondeur des plis est comprise dans la largeur */
const pleatPanel = (m: Measures, back: boolean): PieceDef => {
  const w = ((m.T + 6) / 2) * 2.2;
  return {
    n: back ? "Dos plissé" : "Devant plissé",
    d: rect(w, m.L),
    w,
    h: m.L,
    q: 1,
    fold: true,
    note: "plis compris",
  };
};

/** Devant croisé de la jupe portefeuille */
const wrapFront = (m: Measures): PieceDef => {
  const hw = (m.H + 4) / 4;
  const tw = (m.T + 4) / 4;
  const w = hw * 1.45;
  return {
    n: "Devant",
    d: `M0 0H${tw}C${tw + (hw - tw) * 0.25} 8 ${hw} 14 ${hw} 22L${w} ${m.L}L0 ${m.L}Z`,
    w,
    h: m.L,
    q: 1,
    fold: true,
    note: "panneau croisé",
  };
};

/** Dos kimono : pièce en T (dos + manches droites d'une seule tenue) */
const kimonoBack = (m: Measures): PieceDef => {
  const nw = 8;
  const arm = m.P * 0.24;
  const sd = Math.max(40, m.P / 4);
  const cw = (m.P + 10) / 4;
  const w = nw + arm + 6;
  return {
    n: "Dos",
    d: `M0 0H${nw}L${w} 0V${sd}H${cw}V${m.L}H0Z`,
    w,
    h: m.L,
    q: 1,
    fold: true,
    note: "pièce en T",
  };
};

const kimonoFront = (m: Measures): PieceDef => {
  const nw = 8;
  const arm = m.P * 0.24;
  const sd = Math.max(40, m.P / 4);
  const cw = (m.P + 10) / 4;
  const w = nw + arm + 6;
  return {
    n: "Devant",
    d: `M0 10L${nw} 0L${w} 0V${sd}H${cw}V${m.L}H0Z`,
    w,
    h: m.L,
    q: 2,
    note: "croisé",
  };
};

/* ------------------------------------------------------------------ */
/* Les 17 modèles                                                      */
/* ------------------------------------------------------------------ */

export const MODELS: Record<ModelKey, Model> = {
  droite: {
    n: "Jupe droite",
    L: 60,
    cat: "jupes",
    desc: "L'intemporelle du vestiaire : une ligne nette, des pinces discrètes et une ceinture à la taille.",
    tags: ["Minimal", "Bureau", "Intemporel"],
    diff: 1,
    fab: "Popeline ou twill de coton",
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
  crayon: {
    n: "Jupe crayon",
    L: 60,
    cat: "jupes",
    desc: "Une silhouette gainante qui épouse les hanches, avec fente au dos pour marcher avec aisance.",
    tags: ["Chic", "Gainant", "Soirée"],
    diff: 2,
    fab: "Gabardine stretch",
    g: (m) => [
      {
        ...skirtPanel(m, false, -0.05),
        note: "pince de taille",
      },
      { ...skirtPanel(m, true, -0.05), note: "fente au dos" },
      belt(m),
    ],
  },
  evasee: {
    n: "Jupe évasée",
    L: 55,
    cat: "jupes",
    desc: "La valeur sûre A-line : évasée depuis les hanches, elle flotte à chaque pas et pardonne tout.",
    tags: ["A-line", "Fluide", "Débutant"],
    diff: 1,
    fab: "Lin lavé ou viscose",
    g: (m) => [skirtPanel(m, false, 0.5), skirtPanel(m, true, 0.5), belt(m)],
  },
  cercle: {
    n: "Jupe cercle",
    L: 60,
    cat: "jupes",
    desc: "Un grand tourbillon de tissu : ourlet rond, mouvement pleine jambes, effet spectaculaire garanti.",
    tags: ["Romantique", "Mouvement", "Festif"],
    diff: 2,
    fab: "Viscose fluide",
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
    cat: "jupes",
    desc: "Un carré dont les pointes dansent : l'ourlet asymétrique effet mouchoir, parfait pour l'été.",
    tags: ["Asymétrique", "Vacances", "Léger"],
    diff: 1,
    fab: "Voile de coton",
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
          note: "pointes tombantes",
        },
        belt(m),
      ];
    },
  },
  portefeuille: {
    n: "Jupe portefeuille",
    L: 62,
    cat: "jupes",
    desc: "Croisée et nouée à la taille : aucun zip, aucun bouton, un tombé ajustable et élégant.",
    tags: ["Croisé", "Ajustable", "Facile"],
    diff: 1,
    fab: "Crêpe de viscose",
    g: (m) => [wrapFront(m), skirtPanel(m, true, 0.35), belt(m, 60)],
  },
  plissee: {
    n: "Jupe plissée",
    L: 58,
    cat: "jupes",
    desc: "Des plis plats réguliers qui jouent avec la lumière : graphique au repos, vivante en mouvement.",
    tags: ["Graphique", "Structuré", "Bureau"],
    diff: 2,
    fab: "Taffetas ou popeline fin",
    g: (m) => [pleatPanel(m, false), pleatPanel(m, true), belt(m)],
  },
  short: {
    n: "Short taille haute",
    L: 40,
    cat: "pantalons",
    desc: "Le short facile de l'été : devant coupé au pli en une pièce, deux dos, ceinture à élastique.",
    tags: ["Été", "Facile", "Débutant"],
    diff: 1,
    fab: "Twill de coton",
    g: (m) => [pantsFrontFold(m), leg(m, true), belt(m)],
  },
  pantalon: {
    n: "Pantalon droit",
    L: 100,
    cat: "pantalons",
    desc: "Le classique à jambe droite : devant entier au pli, deux dos, montage par les entrejambes.",
    tags: ["Classique", "Bureau", "Vestiaire"],
    diff: 2,
    fab: "Gabardine de laine",
    g: (m) => [pantsFrontFold(m), leg(m, true), belt(m)],
  },
  large: {
    n: "Pantalon large",
    L: 105,
    cat: "pantalons",
    desc: "Fluide et majestueux : devant au pli, ourlet évasé depuis le genou pour un mouvement aéré.",
    tags: ["Fluide", "Confort", "Tendance"],
    diff: 1,
    fab: "Crêpe lourd ou lin",
    g: (m) => [pantsFrontFold(m, 1), leg(m, true, 1), belt(m)],
  },
  tshirt: {
    n: "Tee-shirt",
    L: 65,
    cat: "hauts",
    desc: "Le patron du quotidien : encolure ronde, manches courtes, légèrement ajusté sur la poitrine.",
    tags: ["Quotidien", "Jersey", "Facile"],
    diff: 1,
    fab: "Jersey de coton",
    g: (m) => [
      body(m, false, 0.06),
      body(m, true, 0.06),
      sleeve(m, 20),
    ],
  },
  tunique: {
    n: "Robe tunique",
    L: 95,
    cat: "hauts",
    desc: "Légèrement évasée sur la hanche, à porter ceinturée ou flottante sur un legging.",
    tags: ["Fluide", "Confort", "Sans manche"],
    diff: 1,
    fab: "Double gaze de coton",
    g: (m) => [body(m, false, 0.15), body(m, true, 0.15)],
  },
  blouse: {
    n: "Blouse fluide",
    L: 68,
    cat: "hauts",
    desc: "Esprit bohème : manches longues évasées, corps souple qui se noue ou se porte lâche.",
    tags: ["Bohème", "Élégant", "Manches longues"],
    diff: 2,
    fab: "Crêpe georgette",
    g: (m) => [
      body(m, false, 0.45),
      body(m, true, 0.45),
      sleeve(m, 55, 4),
    ],
  },
  robe: {
    n: "Robe trapèze",
    L: 90,
    cat: "vestes",
    desc: "La silhouette 60's : épaules nettes, sans manche, jupe qui s'évase vers le genou.",
    tags: ["Rétro", "Aérien", "Festif"],
    diff: 1,
    fab: "Lin ou crêpe léger",
    g: (m) => [body(m, false, 0.75), body(m, true, 0.75)],
  },
  blazer: {
    n: "Blazer col châle",
    L: 60,
    cat: "vestes",
    desc: "La pièce maîtresse du tailoring : col châle, devants croisés, manches montées fronceuses.",
    tags: ["Tailleur", "Chic", "Avancé"],
    diff: 3,
    fab: "Laine froide ou bouclé",
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
  kimono: {
    n: "Kimono ceinturé",
    L: 95,
    cat: "vestes",
    desc: "Une pièce en T géniale : dos et manches d'une seule tenue, devants croisés, ceinture large.",
    tags: ["Détente", "Layering", "Facile"],
    diff: 1,
    fab: "Viscose lavée",
    g: (m) => [kimonoBack(m), kimonoFront(m), belt(m, 30)],
  },
  manche: {
    n: "Étude de manche",
    L: 58,
    cat: "bases",
    desc: "La manche de base à tête ronde : parfait pour s'entraîner au fronce et au montage.",
    tags: ["Technique", "Base", "Essayage"],
    diff: 2,
    fab: "Popeline (toile d'essai)",
    g: (m) => [sleeve(m, m.L)],
  },
};

/* ------------------------------------------------------------------ */
/* Pliage du tissu par modèle                                          */
/* ------------------------------------------------------------------ */

export const FOLD: Record<ModelKey, string> = {
  droite:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  crayon:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieux devant et dos ; la fente se trace au milieu dos.",
  evasee:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  cercle:
    "Pliez le tissu en quatre : pliez en deux, puis encore en deux. Le coin plié sera la taille.",
  mouchoir:
    "Dépliez le tissu à plat : c'est un carré. Pliez-le en diagonale pour repérer le centre, qui sera le trou de taille.",
  portefeuille:
    "Pliez le tissu en deux pour le dos. Le devant se coupe en une seule pièce au pli : le croisement se fait au montage.",
  plissee:
    "Pliez le tissu en deux, endroit contre endroit. Chaque panneau est deux fois plus large que la taille : les plis sont compris.",
  short:
    "Pliez le tissu en deux, endroit contre endroit. Le devant se coupe ENTIER au pli ; les deux dos se coupent en miroir.",
  pantalon:
    "Pliez le tissu en deux, endroit contre endroit. Le devant se coupe ENTIER au pli (les 2 jambes) ; les deux dos se coupent en miroir.",
  large:
    "Pliez le tissu en deux, endroit contre endroit. Le devant se coupe ENTIER au pli ; les deux dos en miroir. Prévoyez une laize large pour l'ourlet évasé.",
  tshirt:
    "Pliez le tissu en deux, endroit contre endroit. Le dos se place au pli, les manches se coupent en paires miroir.",
  tunique:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  blouse:
    "Pliez le tissu en deux, endroit contre endroit. Les manches évasées se coupent en paires miroir.",
  robe:
    "Pliez le tissu en deux, endroit contre endroit. Le pli sert de milieu devant et de milieu dos.",
  blazer:
    "Pliez le tissu en deux, endroit contre endroit. Le dos se place au pli, les devants et les manches se coupent en paires miroir.",
  kimono:
    "Pliez le tissu en deux, endroit contre endroit. Le dos en T se coupe au pli, les devants en paires miroir.",
  manche:
    "Pliez le tissu en deux, endroit contre endroit, pour couper les deux manches en miroir.",
};

/* ------------------------------------------------------------------ */
/* Placement sur le tissu (algorithme de rayonnage)                    */
/* ------------------------------------------------------------------ */

export interface PlacedPiece extends PieceDef {
  id: number;
  name: string;
  /** second exemplaire d'une paire = miroir */
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
/* Assemblage pas à pas (montage visuel cumulatif)                     */
/*                                                                     */
/* Chaque étape :                                                      */
/*   [consigne, ancre, pièce à joindre, type de jonction, couture]     */
/* - ancre / pièce : nom de pièce, avec occurrence « ·2 » si nécessaire */
/* - Jonctions (l'ancre reste en place, la pièce vient se coller) :     */
/*     ll = miroir à gauche · rr = miroir à droite · rl = bord à droite */
/*     tt = miroir au-dessus · bt = en dessous · ct = centré dessus     */
/* - Étape sans jonction = préparation sur la pièce citée.              */
/* ------------------------------------------------------------------ */

export type Join =
  | "ll" // miroir à gauche (bord droit de la pièce contre bord gauche de l'ancre)
  | "rr" // miroir à droite
  | "rl" // bord à droite, sans miroir
  | "tt" // miroir au-dessus, aligné à gauche
  | "tc" // au-dessus, centré sur l'ancre (ceintures)
  | "bt" // en dessous
  | "ct"; // centré dessus (ceinture nouée, enfilée)

export type AsmStep = [string, string?, string?, Join?, string?];

export const ASM: Record<ModelKey, AsmStep[]> = {
  droite: [
    [
      "Piquez les pinces de taille du devant, puis du dos, en pli creux.",
      "Devant",
      undefined,
      undefined,
      "Couture de préparation : pinces de taille (milieux devant et dos)",
    ],
    [
      "Assemblez le dos au devant, bord contre bord, endroit contre endroit.",
      "Devant",
      "Dos",
      "ll",
      "Côtés : bord droit du devant ↔ bord gauche du dos, à 1,5 cm",
    ],
    [
      "Ceinture montée : entoilez-la, pliez-la en deux endos contre endos, puis appliquez-la sur la taille.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut de la jupe ↔ ceinture, bords égaux, endroit contre endroit, à 1 cm",
    ],
    [
      "Posez la fermeture au milieu dos, surpiquez la ceinture dans la gouttière, puis faites l'ourlet à 3 cm.",
      "Dos",
      undefined,
      undefined,
      "Finitions : fermeture invisible + surpiqûre de ceinture + ourlet",
    ],
  ],
  crayon: [
    [
      "Piquez les pinces de taille, devant et dos.",
      "Devant",
      undefined,
      undefined,
      "Couture de préparation : pinces de taille",
    ],
    [
      "Assemblez les côtés en gardant la fente du dos ouverte.",
      "Devant",
      "Dos",
      "ll",
      "Côtés : bord droit du devant ↔ bord gauche du dos (fente au milieu dos)",
    ],
    [
      "Ceinture montée : entoilée, pliée en deux, appliquée endroit contre endroit à la taille.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut de la jupe ↔ ceinture, bords égaux, à 1 cm",
    ],
    [
      "Finissez la fente au milieu dos, surpiquez la ceinture, puis ourlez bien près.",
      "Dos",
      undefined,
      undefined,
      "Finitions : fente dos + surpiqûre de ceinture + ourlet à 2 cm",
    ],
  ],
  evasee: [
    [
      "Assemblez le dos au devant sur les côtés.",
      "Devant",
      "Dos",
      "ll",
      "Côtés : bord droit du devant ↔ bord gauche du dos, à 1,5 cm",
    ],
    [
      "Ceinture montée : entoilée, pliée en deux, appliquée à la taille, couture repassée vers le haut.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut de la jupe ↔ ceinture, bords égaux",
    ],
    [
      "Surpiquez la ceinture dans la gouttière, puis ourlet roulotté de 2 cm : l'évasement tombera tout seul.",
      "Devant",
      undefined,
      undefined,
      "Finitions : surpiqûre de ceinture + ourlet roulotté sur tout le tour",
    ],
  ],
  cercle: [
    [
      "Épinglez deux quarts bord à bord, endroit contre endroit.",
      "Quart de jupe",
      "Quart de jupe",
      "ll",
      "Couture n°1 : bord des quarts ↔ bord des quarts, à 1 cm",
    ],
    [
      "Ajoutez le troisième quart sur le bord libre.",
      "Quart de jupe",
      "Quart de jupe",
      "rr",
      "Couture n°2 : bord des quarts ↔ bord des quarts",
    ],
    [
      "Puis le quatrième : le cercle se referme.",
      "Quart de jupe ·2",
      "Quart de jupe",
      "ll",
      "Couture n°3 : dernier bord ↔ premier bord",
    ],
    [
      "Ceinture montée : entoilée, pliée en deux, appliquée sur le trou de taille, répartie en 4.",
      "Quart de jupe ·1",
      "Ceinture",
      "tc",
      "Taille : trou de la jupe ↔ ceinture, réparti en 4",
    ],
    [
      "Fendez un côté pour la fermeture, puis ourlez à 2 cm.",
      "Quart de jupe",
      undefined,
      undefined,
      "Finitions : fermeture + ourlet circulaire",
    ],
  ],
  mouchoir: [
    [
      "Pliez en diagonale pour repérer le centre : c'est la taille.",
      "Carré",
      undefined,
      undefined,
      "Repérage : centre du carré = trou de taille",
    ],
    [
      "Posez la ceinture sur le trou central.",
      "Carré",
      "Ceinture",
      "ct",
      "Taille : trou central ↔ ceinture, réparti tout autour",
    ],
    [
      "Fendez un côté pour la fermeture, puis roulottez les quatre bords.",
      "Carré",
      undefined,
      undefined,
      "Finitions : fermeture + ourlets roulottés des 4 pointes",
    ],
  ],
  portefeuille: [
    [
      "Superposez les deux épaisseurs du panneau croisé et bâtissez.",
      "Devant",
      undefined,
      undefined,
      "Préparation : panneau croisé bâti sur le bord",
    ],
    [
      "Assemblez le panneau croisé au dos sur les côtés.",
      "Devant",
      "Dos",
      "ll",
      "Côtés : bord du panneau croisé ↔ bord du dos, à 1,5 cm",
    ],
    [
      "Ceinture-liens : entoilée, pliée en deux, appliquée à la taille — les longues extrémités se nouent devant.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut de la jupe ↔ liens, croisés dans le dos",
    ],
  ],
  plissee: [
    [
      "Pliez et piquez chaque pli plat du devant, puis du dos.",
      "Devant plissé",
      undefined,
      undefined,
      "Coutures des plis : tous dans le même sens, du haut vers le bas",
    ],
    [
      "Assemblez les côtés en gardant les plis bien à plat.",
      "Devant plissé",
      "Dos plissé",
      "ll",
      "Côtés : bord du devant ↔ bord du dos, plis maintenus",
    ],
    [
      "Ceinture montée : entoilée, pliée en deux, appliquée à la taille — les plis pris dans la couture.",
      "Devant plissé",
      "Ceinture",
      "tc",
      "Taille : haut des plis ↔ ceinture, plis répartis et fixés",
    ],
  ],
  short: [
    [
      "Surfilez les pièces, puis piquez les pinces du devant et des dos.",
      "Devant",
      undefined,
      undefined,
      "Coutures de préparation : pinces de taille",
    ],
    [
      "Prenez un dos et le devant : assemblez l'entrejambe gauche, de la fourche au bas.",
      "Devant",
      "Dos",
      "ll",
      "Entrejambe gauche : bord du dos ↔ bord du devant, endroit contre endroit, à 1,5 cm",
    ],
    [
      "Prenez le second dos : assemblez l'entrejambe droit.",
      "Devant",
      "Dos ·2",
      "rl",
      "Entrejambe droit : bord du dos ↔ bord du devant, à 1,5 cm",
    ],
    [
      "Ceinture : pliez le bandeau en deux endos contre endos, fermez le tube, glissez l'élastique et appliquez à la taille.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : ceinture tube ↔ haut du short, élastique réparti régulièrement",
    ],
    [
      "Ourlez le bas de chaque jambe à 3 cm.",
      "Devant",
      undefined,
      undefined,
      "Finitions : ourlets des deux jambes à 3 cm",
    ],
  ],
  pantalon: [
    [
      "Surfilez les pièces. Piquez les pinces du devant et des dos, en pli creux.",
      "Devant",
      undefined,
      undefined,
      "Coutures de préparation : pinces de taille (devant et dos)",
    ],
    [
      "Prenez un dos et le devant : assemblez l'entrejambe gauche, de la fourche à l'ourlet.",
      "Devant",
      "Dos",
      "ll",
      "Entrejambe gauche : bord du dos ↔ bord du devant, endroit contre endroit, à 1,5 cm",
    ],
    [
      "Prenez le second dos : assemblez l'entrejambe droit, exactement comme le premier.",
      "Devant",
      "Dos ·2",
      "rl",
      "Entrejambe droit : bord du dos ↔ bord du devant, à 1,5 cm",
    ],
    [
      "Assemblez le milieu dos, de la fourche à la taille, puis montez la fermeture invisible.",
      "Dos ·2",
      undefined,
      undefined,
      "Milieu dos : couture à 1,5 cm + fermeture invisible dans le pli",
    ],
    [
      "Ceinture montée : entoilez-la, pliez-la en deux endos contre endos, puis appliquez-la sur la taille.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut du pantalon ↔ ceinture, bords égaux, à 1 cm",
    ],
    [
      "Repliez le bord libre de la ceinture et surpiquez dans la gouttière, puis ourlez chaque jambe à 3 cm.",
      "Devant",
      undefined,
      undefined,
      "Finitions : surpiqûre de ceinture dans la gouttière + ourlets des jambes",
    ],
  ],
  large: [
    [
      "Surfilez les pièces. Piquez les pinces du devant et des dos.",
      "Devant",
      undefined,
      undefined,
      "Coutures de préparation : pinces de taille",
    ],
    [
      "Prenez un dos et le devant : assemblez l'entrejambe gauche, de la fourche à l'ourlet.",
      "Devant",
      "Dos",
      "ll",
      "Entrejambe gauche : bord du dos ↔ bord du devant, à 1,5 cm",
    ],
    [
      "Prenez le second dos : assemblez l'entrejambe droit, d'un seul geste.",
      "Devant",
      "Dos ·2",
      "rl",
      "Entrejambe droit : bord du dos ↔ bord du devant, à 1,5 cm",
    ],
    [
      "Assemblez le milieu dos, puis montez la fermeture invisible.",
      "Dos ·2",
      undefined,
      undefined,
      "Milieu dos : couture à 1,5 cm + fermeture invisible",
    ],
    [
      "Ceinture montée : entoilée et pliée en deux, appliquez-la endroit contre endroit sur la taille.",
      "Devant",
      "Ceinture",
      "tc",
      "Taille : haut du pantalon ↔ ceinture, bords égaux, à 1 cm",
    ],
    [
      "Surpiquez la ceinture dans la gouttière, puis ourlez à 4 cm : un ourlet profond donne le tombé.",
      "Devant",
      undefined,
      undefined,
      "Finitions : surpiqûre de ceinture + ourlets profonds des deux jambes",
    ],
  ],
  tshirt: [
    [
      "Assemblez les épaules, endroit contre endroit.",
      "Devant",
      "Dos",
      "tt",
      "Épaules : haut du devant ↔ haut du dos, à 1 cm",
    ],
    [
      "Montez la manche dans l'emmanchure droite, à plat.",
      "Devant",
      "Manche",
      "rl",
      "Emmanchure droite : tête de manche fronceée ↔ emmanchure du devant",
    ],
    [
      "Montez la seconde manche dans l'emmanchure gauche.",
      "Devant",
      "Manche",
      "ll",
      "Emmanchure gauche : tête de manche fronceée ↔ emmanchure du dos",
    ],
    [
      "Fermez les côtés et le dessous des manches d'un seul geste.",
      "Devant",
      undefined,
      undefined,
      "Côtés + sous-bras : de l'emmanchure au bas, en une couture",
    ],
    [
      "Posez l'encolure en biais, puis ourlez le bas.",
      "Devant",
      undefined,
      undefined,
      "Encolure : bande biais ↔ encolure, étirée légèrement",
    ],
  ],
  tunique: [
    [
      "Assemblez les épaules, devant contre dos.",
      "Devant",
      "Dos",
      "tt",
      "Épaules : haut du devant ↔ haut du dos, à 1 cm",
    ],
    [
      "Posez le biais d'encolure et d'emmanchures avant de fermer.",
      "Devant",
      undefined,
      undefined,
      "Encolure + emmanchures : biais posé à plat",
    ],
    [
      "Fermez les côtés, de l'emmanchure au bas.",
      "Devant",
      undefined,
      undefined,
      "Côtés : de l'emmanchure à l'ourlet, à 1,5 cm",
    ],
    [
      "Ourlez le bas à 3 cm.",
      "Devant",
      undefined,
      undefined,
      "Finitions : ourlet du bas",
    ],
  ],
  blouse: [
    [
      "Assemblez les épaules, endroit contre endroit.",
      "Devant",
      "Dos",
      "tt",
      "Épaules : haut du devant ↔ haut du dos, à 1 cm",
    ],
    [
      "Montez la manche évasée dans l'emmanchure droite.",
      "Devant",
      "Manche",
      "rl",
      "Emmanchure droite : tête de manche ↔ emmanchure du devant",
    ],
    [
      "Montez la seconde manche à gauche.",
      "Devant",
      "Manche",
      "ll",
      "Emmanchure gauche : tête de manche ↔ emmanchure du dos",
    ],
    [
      "Fermez les côtés et le dessous des manches.",
      "Devant",
      undefined,
      undefined,
      "Côtés + sous-bras : de l'emmanchure au bas, en une couture",
    ],
    [
      "Faites l'encolure roulottée, puis un ourlet fin partout.",
      "Devant",
      undefined,
      undefined,
      "Finitions : encolure roulottée + ourlets fins",
    ],
  ],
  robe: [
    [
      "Assemblez les épaules, devant contre dos.",
      "Devant",
      "Dos",
      "tt",
      "Épaules : haut du devant ↔ haut du dos, à 1 cm",
    ],
    [
      "Posez le biais d'encolure et d'emmanchures.",
      "Devant",
      undefined,
      undefined,
      "Encolure + emmanchures : biais posé à plat",
    ],
    [
      "Fermez les côtés, de l'emmanchure à l'ourlet.",
      "Devant",
      undefined,
      undefined,
      "Côtés : de l'emmanchure à l'ourlet, à 1,5 cm",
    ],
    [
      "Ourlez à 4 cm à la main pour un beau tombé.",
      "Devant",
      undefined,
      undefined,
      "Finitions : ourlet main à 4 cm",
    ],
  ],
  blazer: [
    [
      "Préparez le dos au pli : milieux renforcés, épaules prêtes.",
      "Dos",
      undefined,
      undefined,
      "Préparation : dos au pli, crans d'épaule reportés",
    ],
    [
      "Assemblez le premier devant au dos : épaule et côté gauche.",
      "Dos",
      "Devant",
      "ll",
      "Épaule + côté gauche : bord du dos ↔ bord du devant, e. c. e.",
    ],
    [
      "Assemblez le second devant : épaule et côté droit.",
      "Dos",
      "Devant",
      "rr",
      "Épaule + côté droit : bord du dos ↔ bord du devant, e. c. e.",
    ],
    [
      "Froncez la tête de la manche gauche et montez-la.",
      "Devant ·1",
      "Manche",
      "ll",
      "Emmanchure gauche : tête de manche fronceée ↔ emmanchure",
    ],
    [
      "Montez la manche droite de la même façon.",
      "Devant ·2",
      "Manche",
      "rr",
      "Emmanchure droite : tête de manche fronceée ↔ emmanchure",
    ],
    [
      "Rabattez les revers, posez la doublure, puis faites l'ourlet.",
      "Devant",
      undefined,
      undefined,
      "Finitions : revers + doublure + ourlets",
    ],
  ],
  kimono: [
    [
      "Le dos en T est prêt : dos et manches d'une seule tenue.",
      "Dos",
      undefined,
      undefined,
      "Préparation : pièce en T au pli, crans d'emmanchure",
    ],
    [
      "Assemblez le premier devant au dos : épaule et côté gauche.",
      "Dos",
      "Devant",
      "ll",
      "Épaule + côté gauche : bord du T ↔ bord du devant",
    ],
    [
      "Assemblez le second devant : épaule et côté droit.",
      "Dos",
      "Devant",
      "rr",
      "Épaule + côté droit : bord du T ↔ bord du devant",
    ],
    [
      "Nouez la ceinture à la taille.",
      "Dos",
      "Ceinture",
      "ct",
      "Taille : ceinture nouée, croisée sur le devant",
    ],
    [
      "Finissez encolures et ourlets.",
      "Dos",
      undefined,
      undefined,
      "Finitions : encolures + ourlets droits",
    ],
  ],
  manche: [
    [
      "La manche est coupée au pli : deux épaisseurs identiques.",
      "Manche",
      undefined,
      undefined,
      "Préparation : pièces de manche repérées (tête, dessous)",
    ],
    [
      "Fermez le dessous : les deux bords se rejoignent.",
      "Manche",
      "Manche",
      "ll",
      "Dessous de manche : bord ↔ bord, endroit contre endroit",
    ],
    [
      "Froncez la tête, montez dans l'emmanchure, puis ourlez.",
      "Manche",
      undefined,
      undefined,
      "Montage : deux fils de fronce à 0,5 et 1,5 cm de la tête",
    ],
  ],
};

export const LETTERS = "ABCDEFGH";
