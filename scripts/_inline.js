
"use strict";
/* ============ Atelier — coupe du tissu · studio de patronage ============ */
const TAU = Math.PI * 2;
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const r1 = n => Math.round(n * 10) / 10;
const fr = n => String(n).replace(".", ",");
const esc = s => String(s);
let UID = 0;

/* ---------- mesure par défaut ---------- */
const m = { P: 92, T: 74, H: 100, L: 58, S: 58, C: 38 };

/* ---------- générateurs de pièces (cm) ---------- */
const rectD = (w, h) => `M0 0H${r1(w)}V${r1(h)}H0Z`;

const ceinture = mm => ({ n: "Ceinture", d: rectD(mm.T + 8, 8), w: r1(mm.T + 8), h: 8, q: 1 });

const jupe = (mm, back, fl) => {
  const tw = mm.T / 4 + 1.5, hw = mm.H / 4 + 1.5, hy = 20, hem = hw + fl * mm.L;
  return { n: back ? "Dos" : "Devant",
    d: `M0 0H${r1(tw)}Q${r1(hw)} ${r1(hy * .55)} ${r1(hw)} ${hy}L${r1(hem)} ${r1(mm.L)}H0Z`,
    w: r1(Math.max(tw, hw, hem)), h: mm.L, q: 1, fold: 1 };
};

const manche = mm => {
  const W = r1(mm.P * .3 + 8), cap = r1(mm.P / 9), sl = r1(mm.S);
  return { n: "Manche",
    d: `M0 ${cap}Q${r1(W * .16)} ${r1(cap * .12)} ${r1(W * .5)} 0Q${r1(W * .84)} ${r1(cap * .12)} ${W} ${cap}L${r1(W - 2.5)} ${sl}H2.5Z`,
    w: W, h: sl, q: 2, pair: 1 };
};

const corsage = (mm, back, fl) => {
  const cw = (mm.P + 8) / 4, sh = r1(mm.P * .21), nw = 7.5, nd = back ? 2.5 : 9,
        ad = r1(mm.P / 6 + 9), hm = r1(cw + (mm.L - ad) * fl);
  return { n: back ? "Dos" : "Devant",
    d: `M0 ${nd}Q${r1(nw * .9)} ${nd} ${nw} 0L${sh} 2.5Q${r1(sh - 3)} ${r1(ad * .6)} ${r1(cw)} ${ad}L${hm} ${r1(mm.L)}H0Z`,
    w: r1(Math.max(hm, cw)), h: mm.L, q: 1, fold: 1 };
};

const devantB = mm => { /* devant blazer, coupé ×2 en miroir */
  const cw = (mm.P + 12) / 4, sh = r1(mm.P * .21), nw = 8.5, ad = r1(mm.P / 6 + 10),
        hm = r1(cw + (mm.L - ad) * .05);
  return { n: "Devant",
    d: `M0 8Q${r1(nw * .9)} 8 ${nw} 0L${sh} 2.5Q${r1(sh - 3)} ${r1(ad * .6)} ${r1(cw)} ${ad}L${hm} ${r1(mm.L)}H0Z`,
    w: r1(Math.max(hm, cw)), h: mm.L, q: 2, pair: 1 };
};

const col = mm => {
  const w = r1(mm.C * 1.15), h = 9;
  return { n: "Col", d: `M0 0H${w}Q${r1(w - 1.5)} ${r1(h * .55)} ${r1(w - 2)} ${h}L2 ${h}Q1.5 ${r1(h * .55)} 0 0Z`,
    w, h, q: 2, pair: 1 };
};

const jambe = (mm, back) => {
  const tw = r1(mm.H / 4 + 3 + (back ? 1 : 0)), fy = r1(mm.L * .62),
        iw = r1(tw * .52 * (back ? 1.08 : 1)), hw = r1(tw * .94);
  return { n: back ? "Jambe dos" : "Jambe devant",
    d: `M0 0H${tw}L${hw} ${r1(mm.L)}L${iw} ${r1(mm.L)}L${iw} ${fy}Q${r1(iw * .9)} ${r1(fy - 8)} 0 ${r1(fy - 15)}Z`,
    w: Math.max(tw, hw), h: mm.L, q: 2, pair: 1 };
};

const quart = mm => { /* quart de jupe cercle (anneau au 4e) */
  const wr = r1(mm.T / TAU + 1.5), Ro = r1(wr + mm.L);
  return { n: "Quart",
    d: `M${wr} 0A${wr} ${wr} 0 0 1 0 ${wr}L0 ${Ro}A${Ro} ${Ro} 0 0 0 ${Ro} 0Z`,
    w: Ro, h: Ro, q: 4, pair: 1 };
};

const carreM = mm => { /* jupe mouchoir : grand carré + trou de taille (evenodd) */
  const s = Math.ceil((mm.L + 12) * 1.42), c = s / 2, rr = r1(mm.T / TAU + 1.5);
  return { n: "Carré",
    d: `M0 0H${s}V${s}H0Z M${r1(c - rr)} ${c}a${rr} ${rr} 0 1 0 ${r1(2 * rr)} 0a${rr} ${rr} 0 1 0 ${r1(-2 * rr)} 0Z`,
    w: s, h: s, q: 1, hole: rr };
};

/* ---------- catalogue des modèles ---------- */
const MODELS = {
droite: { n: "Jupe droite", cat: "Jupes", L: 58, dif: 1, laize: 120,
  use: ["T", "H", "L"],
  tis: "Gabardine, crêpe, velours fin",
  tags: ["Classique", "Bureau", "Zip invisible"],
  desc: "La silhouette droite, héritée des années 60, structure la taille et allonge la jambe. Une fermeture invisible au dos, une fente d'aisance et une ceinture franche : l'intemporel des garde-robes soignées, porté aussi bien avec un chemisier rentré qu'un pull fin.",
  fold: "Plier en deux, lisière contre lisière — Devant & Dos sur le pli.",
  g: mm => [jupe(mm, 0, .02), jupe(mm, 1, .008), ceinture(mm)],
  meth: [
    "Décatir le tissu et repasser à plat. Repérer l'endroit et l'envers au crayon discret.",
    "Plier endroit contre endroit, lisières alignées : le Devant et le Dos se coupent au pli, encolure de taille au bord supérieur.",
    "Épingler le long du droit-fil, tracer les pinces au savon, puis couper marge de 1 cm comprise.",
    "Crayer l'emplacement de la fente au dos et les repères de pinces avant de dépiquer.",
    "Couper la ceinture à plat dans une chute, droit-fil parallèle à la lisière."],
  st: [
    { k: "fin", p: [0], t: "Préparation des bords", d: "Surjetez ou fraisez les bords crantés des deux pans de jupe avant toute couture — le tissu ne s'effilochera pas au montage." },
    { k: "rr", p: [0, 1], t: "Côtés, endroit contre endroit", d: "Épinglez Devant et Dos ensemble. Piquez les deux côtés à 1 cm, en laissant 20 cm ouverts en haut du dos pour la fermeture éclair." },
    { k: "tt", p: [1, 2], t: "Montage de la ceinture", d: "La ceinture se coud endroit contre endroit sur le haut de la jupe, puis se retourne et se surpique à la main pour une finition invisible." },
    { k: "hem", p: [0], t: "Ourlet du bas", d: "Rentrez 3 cm sur l'envers, ficelez au fer, puis surpiquez à 2,5 mm du bord replié pour un ourlet net et souple." },
    { k: "final" } ] },

cercle: { n: "Jupe cercle", cat: "Jupes", L: 58, dif: 1, laize: 140,
  use: ["T", "L"],
  tis: "Viscose, satin de coton, crêpe fluide",
  tags: ["Fluide", "Tombé circulaire", "Fronces réparties"],
  desc: "Un arc de tissu plein : la jupe cercle tourne, ondule et respire à chaque pas. Sa construction en quatre quarts répartit la mémoire du tissu tout autour de la taille. Le tombé demande un tissu souple qui prendra belle ampleur dès la première virevolte.",
  fold: "Plié dans la longueur — quarts alternés en miroir pour économiser la surface.",
  g: mm => [quart(mm), ceinture(mm)],
  meth: [
    "Décatir soigneusement : les tissus fluides glissent, repassez sur une surface stable.",
    "Tracez les quatre quarts en alternance miroir, arcs de taille orientés vers la lisière.",
    "Épinglez abondamment dans les courbes, puis coupez les arcs d'un geste souple et continu.",
    "Marquez le milieu de chaque arc de taille : ces repères guident le réparti des fronces.",
    "Coupez la ceinture dans le droit-fil, dans une chute stable."],
  st: [
    { k: "rr", p: [0, 1], t: "Première couture de quart", d: "Assemblez les quarts 1 et 2 endroit contre endroit, à 1 cm. Les arcs complémentaires forment déjà la moitié du cercle." },
    { k: "rr", p: [1, 2], t: "Deuxième quart", d: "Poursuivez le cercle : le quart 3 rejoint le 2. Vérifiez à chaque couture que les arcs de taille restent alignés." },
    { k: "rr", p: [2, 3], t: "Dernier quart", d: "Le quart 4 ferme le cercle en rejoignant le 1. Laissez 20 cm ouverts en haut d'une couture pour la fermeture." },
    { k: "tt", p: [3, 4], t: "Ceinture fronceur", d: "Froncez l'arc de taille entre les repères, puis montez la ceinture endroit contre endroit. Les fronces se répartissent régulièrement." },
    { k: "hem", p: [0], t: "Ourlet circulaire", d: "L'ourlet se coud en biais flottant : rentrez 1,5 cm, laissez retomber 24 h, puis surpiquez — le biais se stabilise tout seul." },
    { k: "final" } ] },

mouchoir: { n: "Jupe mouchoir", cat: "Jupes", L: 58, dif: 1, laize: 140,
  use: ["T", "L"],
  tis: "Jersey, jersey de coton, crêpe léger",
  tags: ["Drapé", "Été", "Sans couture côté"],
  desc: "Quatre pointes, aucune couture latérale : le grand carré se drape tout seul autour de la taille, et chaque pas anime les pointes. Le trou de taille est découpé au centre, l'ourlet roulé délicat termine le pourtour. Le modèle le plus spectaculaire pour trois gestes de couture.",
  fold: "À plat, une seule épaisseur — le grand carré se coupe sans pli.",
  g: mm => [carreM(mm), ceinture(mm)],
  meth: [
    "Coupez à plat, en une seule épaisseur : le carré ne supporte aucun pli de coupe.",
    "Tracez le trou de taille au compas (rayon indiqué sur la pièce), au centre exact du carré.",
    "Faufilez le cercle, puis découpez lentement en tournant le tissu — pas les ciseaux.",
    "Surfilez immédiatement le tour du trou : les biais du centre sont fragiles.",
    "Prévoyez l'ourlet roulé sur tout le pourtour sans entamer les diagonales."],
  st: [
    { k: "fin", p: [0], t: "Surjet du pourtour", d: "Surjetez tout le tour du carré, pointes comprises. Sur jersey, le surjet remplace l'ourlet provisoire et stabilise les diagonales." },
    { k: "tt", p: [0, 1], t: "Ceinture élastique", d: "La ceinture se pose sur le trou de taille, tendue régulièrement entre quatre repères, puis se retourne à la main." },
    { k: "hem", p: [0], t: "Ourlet roulé", d: "Ourlet roulé à la machine ou point main sur tout le pourtour : 4 mm de repli, point avant minuscule, sans tirer le biais." },
    { k: "final" } ] },

short: { n: "Short taille haute", cat: "Pantalons", L: 38, dif: 2, laize: 140,
  use: ["T", "H", "L"],
  tis: "Toile de coton, velours côtelé, lin lavé",
  tags: ["Casual", "Taille haute", "Poches italiennes"],
  desc: "Un short taille haute à l'assise nette : fourche dessinée, jambes droites, ceinture franche et poches italiennes crantées avant découpe. En toile pour l'été, en velours côtelé pour l'automne — le même patron couvre les saisons.",
  fold: "Plié dans la hauteur — jambes devant et dos en miroir.",
  g: mm => [jambe(mm, 0), jambe(mm, 1), ceinture(mm)],
  meth: [
    "Pliez le tissu endroit contre endroit dans la hauteur, lisières ensemble.",
    "Placez les jambes en miroir, droit-fil strictement parallèle à la lisière.",
    "Tracez la fourche et les emplacements de poches avant toute découpe.",
    "Coupez marge comprise, puis crayez les milieux de devants et de dos.",
    "Ceinture coupée à plat dans le droit-fil, dans une chute ferme."],
  st: [
    { k: "rr", p: [0, 2], t: "Couture de côté — droite", d: "Jambe devant 1 sur jambe dos 1, endroit contre endroit : piquez le côté à 1 cm du haut de la ceinture au bas de la jambe." },
    { k: "rr", p: [1, 3], t: "Couture de côté — gauche", d: "Même geste de l'autre côté. Les deux jambes sont maintenant reliées — le short prend forme." },
    { k: "bt", p: [0, 2], t: "Fourche d'entrejambe", d: "Assemblez devant et dos le long de la fourche, en suivant la courbe en V. Surpiquez la couture vers l'arrière pour la solidité." },
    { k: "tt", p: [1, 4], t: "Montage de la ceinture", d: "Ceinture endroit contre endroit sur le haut du short, puis retournée et surpiquée. Laissez l'emplacement du bouton." },
    { k: "hem", p: [0], t: "Ourlets de jambes", d: "Rentrez 2,5 cm sur chaque jambe, ficelez, surpiquez. Le tombé droit demande un ourlet parfaitement régulier." },
    { k: "final" } ] },

tunique: { n: "Tunique fentes", cat: "Hauts", L: 78, dif: 2, laize: 140,
  use: ["P", "T", "L", "S", "C"],
  tis: "Viscose lavée, double gaze, lin souple",
  tags: ["Ample", "Fentes latérales", "Ceinture amovible"],
  desc: "Une coupe ample et aérée qui tombe juste : épaules nettes, manches tombantes, fentes latérales qui libèrent la marche. La ceinture nouée à la taille en fait une pièce de jour comme de soirée, sublime sur double gaze.",
  fold: "Plié dans la longueur — Devant & Dos sur le pli.",
  g: mm => [corsage(mm, 0, .18), corsage(mm, 1, .18), manche(mm), ceinture(mm)],
  meth: [
    "Décatir et repasser, tissu plié endroit contre endroit dans la longueur.",
    "Devant et Dos sur le pli, encolure au bord supérieur du pliage.",
    "Manches ×2 côte à côte sur la chute, sommet de tête vers le pli, droit-fil vertical.",
    "Marquez le bas des emmanchures et la ligne de taille avant de dépingler.",
    "Ceinture : coupez dans le droit-fil dans une chute stable, pas en biais."],
  st: [
    { k: "tt", p: [1, 0], t: "Épaules", d: "Devant et Dos endroit contre endroit : piquez les deux épaules à 1 cm, puis ouvrez les coutures au fer pour un montage plat." },
    { k: "rl", p: [0, 2], t: "Montage de la manche 1", d: "Épinglez la tête de manche dans l'emmanchure, trois tirets de réparti. Piquez à 1 cm sans faire de fronce." },
    { k: "rl", p: [1, 3], t: "Montage de la manche 2", d: "Même montage en miroir. Vérifiez la symétrie des têtes de manche avant la couture définitive." },
    { k: "rr", p: [0, 1], t: "Côtés et dessous de manches", d: "Un seul passage : du poignet au bas de la tunique, manche puis côté d'un seul geste à 1 cm." },
    { k: "fin", p: [0], t: "Encolure au biais", d: "Posez un biais d'encolure maison : il enveloppe la découpe, se retourne et se surpique au point invisible." },
    { k: "tt", p: [1, 4], t: "Ceinture nouée", d: "La ceinture passe dans des passants ou se noue librement sur la taille : elle sculpte l'ampleur à votre goût." },
    { k: "final" } ] },

haut: { n: "Haut essentiel", cat: "Hauts", L: 58, dif: 2, laize: 120,
  use: ["P", "T", "L", "S", "C"],
  tis: "Popeline, chambray, tencel",
  tags: ["Essentiel", "Encolure ronde", "Coutures nettes"],
  desc: "L'essentiel de la garde-robe : un haut juste à encolure ronde, épaules propres, manches longues ajustées et finitions au biais. La pièce que l'on coud d'abord, puis recoud sans cesse — en popeline blanche, en chambray, en tencel noir.",
  fold: "Plié dans la longueur — Devant & Dos sur le pli.",
  g: mm => [corsage(mm, 0, .1), corsage(mm, 1, .08), manche(mm)],
  meth: [
    "Tissu plié endroit contre endroit : Devant et Dos au pli, encolure au bord supérieur.",
    "Manches ×2 sur la double épaisseur, tête de manche orientée vers le pli.",
    "Crayez l'encolure et les repères de montage des manches.",
    "Coupez d'un geste continu le long des emmanchures — pas d'encoche manquée.",
    "Prévoyez une bande d'encolure dans une chute, dans le droit-fil."],
  st: [
    { k: "tt", p: [1, 0], t: "Épaules", d: "Piquez les épaules à 1 cm, endroit contre endroit, puis ouvrez au fer. Une bande renfort évite qu'elles s'étirent." },
    { k: "rl", p: [0, 2], t: "Montage de la manche 1", d: "Tête de manche dans l'emmanchure, tirets alignés. Piquez rond, sans pli, à 1 cm." },
    { k: "rl", p: [1, 3], t: "Montage de la manche 2", d: "Même montage en miroir, vérifiez la hauteur des deux têtes avant de piquer." },
    { k: "rr", p: [0, 1], t: "Côtés en une fois", d: "Du poignet au bas du haut, manche et côté en une seule couture à 1 cm. Ouvrez les coutures au fer, à plat." },
    { k: "fin", p: [0], t: "Encolure au biais", d: "Bande d'encolure posée à plat, retournée et surpiquée : le col rond reste net après chaque lavage." },
    { k: "hem", p: [1], t: "Ourlets du bas", d: "Rentrez 2 cm au bas du corps et 1,5 cm aux poignets, ficelez, surpiquez — les ourlets se répondent." },
    { k: "final" } ] },

blazer: { n: "Blazer revers cranté", cat: "Vestes", L: 72, dif: 3, laize: 150,
  use: ["P", "T", "L", "S", "C"],
  tis: "Laine froide, flanelle, gabardine de laine",
  tags: ["Tailoring", "Revers crantés", "Épaules nettes"],
  desc: "L'architecture du tailoring : épaules dessinées, revers crantés, ceinture de taille marquée par des pinces profondes. La pièce maîtresse d'une garde-robe — cousez-la en laine froide pour trois saisons, la doublure en fait un vêtement qui se porte des années.",
  fold: "Devants à plat en miroir, Dos sur le pli.",
  g: mm => [devantB(mm), corsage(mm, 1, .04), manche(mm), col(mm)],
  meth: [
    "Décatir la laine à la vapeur, sans écraser : le tissu doit garder sa vie.",
    "Devants ×2 en miroir sur simple épaisseur, Dos sur le pli.",
    "Manches ×2 et Col ×2 sur la chute, droit-fil rigoureusement vertical.",
    "Tracez revers, boutonnières et emplacements de poches au fil à tracer, avant la coupe.",
    "Réservez les chutes des devants pour les parementures et dessous de poches."],
  st: [
    { k: "tt", p: [2, 0], t: "Épaules", d: "Dos et devants endroit contre endroit : épaules piquées à 1 cm puis moulées au fer à repasser — le renfort d'épaule vient ensuite." },
    { k: "rl", p: [0, 3], t: "Montage de la manche 1", d: "La tête de manche embuée se pose dans l'emmanchure : tirets de hauteur, réparti régulier, couture à 1 cm côté corps." },
    { k: "rl", p: [1, 4], t: "Montage de la manche 2", d: "Second manchon en miroir. Les deux têtes doivent présenter la même avance de 1 cm au bout d'épaule." },
    { k: "rr", p: [0, 2], t: "Côtés et dessous de manches", d: "Piquez du poignet au bas de la veste en un passage. Ouvrez les coutures au fer manche puis corps." },
    { k: "rl", p: [0, 5], t: "Montage du col", d: "Le col se monte entre les encolures, crans alignés : d'abord le dessous, puis le dessus au point d'arrêt main." },
    { k: "fin", p: [0], t: "Parementure et boutonnières", d: "Parementures assemblées aux devants, revers crantés moulés au fer, boutonnières ouvertes au découseur — la signature du tailoring." },
    { k: "final" } ] }
};
/* ============ APERÇUS SVG DU VÊTEMENT FINI ============ */
/* Chaque aperçu est dessiné d'après les mesures réelles : le client voit le style obtenu. */
const PVS = {
droite(v, id) {
  const tw = (v.T + 6) / 2, hw = (v.H + 6) / 2, hm = hw - 2, L = v.L;
  const s = Math.min(1.02, 176 / L, 150 / hw);
  const d = `M${-tw / 2} 6.5C${-hw / 2} ${L * .3} ${-hm / 2} ${L * .34} ${-hm / 2} ${L}L${hm / 2} ${L}C${hm / 2} ${L * .34} ${hw / 2} ${L * .3} ${tw / 2} 6.5Z`;
  const body = `
    <rect class="band" x="${-tw / 2}" y="0" width="${tw}" height="7" rx="2.5"/>
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M0 15V${L - 6}M${-tw / 4 + 1} 14L${-tw / 4 + 4} 34M${tw / 4 - 1} 14L${tw / 4 - 4} 34"/>
    <path class="gs" d="M${-hm / 2 + 3} ${L - 5}H${hm / 2 - 3}"/>`;
  return { s, ty: (250 - L * s) / 2 + 2, gx: hw * s * .5 + 6, gy: 0, body, gyFrom: L };
},
cercle(v, id) {
  const wr = v.T / TAU + 1.5, tw = wr + 2, L = v.L, hw2 = Math.min(88, wr + L * 1.12);
  const s = Math.min(1, 176 / (L * 1.1), 168 / (hw2 * 2));
  const d = `M${-tw} 8C${-hw2 * .6} ${L * .26} ${-hw2 / 2} ${L * .5} ${-hw2 / 2} ${L * .97}Q${-hw2 * .24} ${L * 1.07} 0 ${L * 1.05}Q${hw2 * .24} ${L * 1.07} ${hw2 / 2} ${L * .97}C${hw2 / 2} ${L * .5} ${hw2 * .6} ${L * .26} ${tw} 8Z`;
  const body = `
    <path class="band" d="M${-tw} 1Q0 7 ${tw} 1L${tw} 7Q0 13 ${-tw} 7Z"/>
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M${-tw * .55} 15C${-hw2 * .42} ${L * .4} ${-hw2 * .36} ${L * .62} ${-hw2 * .34} ${L * .96}M${tw * .55} 15C${hw2 * .42} ${L * .4} ${hw2 * .36} ${L * .62} ${hw2 * .34} ${L * .96}"/>`;
  return { s, ty: (250 - L * 1.08 * s) / 2 + 2, gx: hw2 * s * .5 + 6, gy: 0, body, gyFrom: L * 1.05 };
},
mouchoir(v, id) {
  const tw = v.T / TAU + 3.5, L = v.L, pw = L * .62, dip = L * 1.22;
  const s = Math.min(1, 172 / dip, 164 / (pw * 2));
  const d = `M${-tw} 8L${-pw} ${L}Q${-pw * .5} ${dip - 10} 0 ${dip}Q${pw * .5} ${dip - 10} ${pw} ${L}L${tw} 8Q0 15 ${-tw} 8Z`;
  const body = `
    <path class="band" d="M${-tw} 1Q0 7 ${tw} 1L${tw} 7Q0 13 ${-tw} 7Z"/>
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M${-tw + 2} 12L${-pw + 7} ${L - 9}M${tw - 2} 12L${pw - 7} ${L - 9}M0 16V${dip - 12}"/>`;
  return { s, ty: (250 - dip * s) / 2 + 2, gx: pw * s + 6, gy: 0, body, gyFrom: dip };
},
short(v, id) {
  const tw = (v.T + 6) / 2, hw = (v.H + 6) / 2, yc = v.L * .62, lo = hw * .97, li = tw * .5, L = v.L;
  const s = Math.min(1.02, 170 / L, 150 / lo);
  const d = `M${-tw / 2} 7C${-hw / 2} ${L * .2} ${-lo / 2} ${L * .28} ${-lo / 2} ${L}L${-li / 2} ${L}Q${-li / 2 + 1.5} ${yc + 9} 0 ${yc}Q${li / 2 - 1.5} ${yc + 9} ${li / 2} ${L}L${lo / 2} ${L}C${lo / 2} ${L * .28} ${hw / 2} ${L * .2} ${tw / 2} 7Z`;
  const body = `
    <rect class="band" x="${-tw / 2}" y="0" width="${tw}" height="6.5" rx="2.2"/>
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M${-tw / 2 + 3} 11L${-tw / 2 + 15} 28M${tw / 2 - 3} 11L${tw / 2 - 15} 28M0 9V${yc - 4}"/>
    <path class="gs" d="M${-lo / 2 + 2.5} ${L - 5}H${-li / 2 - 2}M${li / 2 + 2} ${L - 5}H${lo / 2 - 2.5}"/>`;
  return { s, ty: (250 - L * s) / 2 + 2, gx: lo * s * .5 + 6, gy: 0, body, gyFrom: L };
},
tunique(v, id) {
  const cw = (v.P + 10) / 2, sw = v.C / 2 + 1, sl = v.S * .72, slw = (v.P * .3 + 8) * .46,
        ad = v.P / 6 + 8, hm = cw + (v.L - ad) * .42, L = v.L, sy = 11;
  const s = Math.min(.98, 176 / L, 168 / ((sw + slw) * 2));
  const d = `M-8 6L${-sw} ${sy}L${-(sw + slw)} ${sy + sl}L${-(sw + slw * .62)} ${sy + sl + 6}L${-cw / 2} ${ad + 9}L${-hm / 2} ${L}L${hm / 2} ${L}L${cw / 2} ${ad + 9}L${sw + slw * .62} ${sy + sl + 6}L${sw + slw} ${sy + sl}L${sw} ${sy}L8 6Q0 14 -8 6Z`;
  const body = `
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M-8 6Q0 16 8 6M${-hm / 2 + 1.5} ${L - 16}V${L - 3}M${hm / 2 - 1.5} ${L - 16}V${L - 3}M0 18V${L - 4}"/>
    <path class="gs" d="M${-(sw + slw * .62) - 2} ${sy + sl + 1.5}L${-(sw + slw) + 3} ${sy + sl - 1.5}M${(sw + slw * .62) + 2} ${sy + sl + 1.5}L${(sw + slw) - 3} ${sy + sl - 1.5}"/>`;
  return { s, ty: (250 - L * s) / 2 + 2, gx: (sw + slw) * s + 6, gy: 0, body, gyFrom: L };
},
haut(v, id) {
  const cw = (v.P + 8) / 2, sw = v.C / 2 + 1, sl = v.S * .78, slw = (v.P * .3 + 6) * .44,
        ad = v.P / 6 + 8, hm = cw * 1.04, L = v.L, sy = 11;
  const s = Math.min(.98, 178 / L, 168 / ((sw + slw) * 2));
  const d = `M-8 6L${-sw} ${sy}L${-(sw + slw)} ${sy + sl}L${-(sw + slw * .68)} ${sy + sl + 5}L${-cw / 2} ${ad + 8}L${-hm / 2} ${L}L${hm / 2} ${L}L${cw / 2} ${ad + 8}L${sw + slw * .68} ${sy + sl + 5}L${sw + slw} ${sy + sl}L${sw} ${sy}L8 6Q0 15 -8 6Z`;
  const body = `
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path class="gd" d="M-8 6Q0 17 8 6M0 18V${L - 4}M${-(sw + slw * .68) - 2} ${sy + sl + 1}L${-(sw + slw) + 3} ${sy + sl - 1.5}M${(sw + slw * .68) + 2} ${sy + sl + 1}L${(sw + slw) - 3} ${sy + sl - 1.5}"/>
    <path class="gs" d="M${-hm / 2 + 3} ${L - 6}H${hm / 2 - 3}"/>`;
  return { s, ty: (250 - L * s) / 2 + 2, gx: (sw + slw) * s + 6, gy: 0, body, gyFrom: L };
},
blazer(v, id) {
  const cw = (v.P + 12) / 2, sw = v.C / 2 + 2, sl = v.S * .72, slw = (v.P * .3 + 10) * .46,
        ad = v.P / 6 + 10, hm = cw + 2, L = v.L, sy = 12;
  const s = Math.min(.98, 178 / L, 168 / ((sw + slw) * 2));
  const d = `M-8 6L${-sw} ${sy}L${-(sw + slw)} ${sy + sl}L${-(sw + slw * .66)} ${sy + sl + 5}L${-cw / 2} ${ad + 9}L${-hm / 2} ${L}L${hm / 2} ${L}L${cw / 2} ${ad + 9}L${sw + slw * .66} ${sy + sl + 5}L${sw + slw} ${sy + sl}L${sw} ${sy}L8 6Q0 13.5 -8 6Z`;
  const body = `
    <path class="band" d="M-8 6Q0 2.8 8 6L6.5 2.6Q0 -.5 -6.5 2.6Z"/>
    <path class="gb" fill="url(#${id}g)" d="${d}"/>
    <path class="gh" fill="url(#${id}h)" d="${d}"/>
    <path d="M-8 6L-2.5 33L-8.5 41Q-5.6 23 -8 6Z" fill="var(--fab2)" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M8 6L2.5 33L8.5 41Q5.6 23 8 6Z" fill="var(--fab2)" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/>
    <path class="gd" d="M-2.5 36V${L - 3}M2.5 36V${L - 3}M${-cw * .38} ${L * .58}H${-cw * .12}M${cw * .12} ${L * .58}H${cw * .38}"/>
    <circle class="btn-c" cx="0" cy="44" r="1.9"/><circle class="btn-c" cx="0" cy="55" r="1.9"/>
    <path class="gs" d="M${-(sw + slw * .66) - 2} ${sy + sl + 1.5}L${-(sw + slw) + 3} ${sy + sl - 1.5}M${(sw + slw * .66) + 2} ${sy + sl + 1.5}L${(sw + slw) - 3} ${sy + sl - 1.5}M${-hm / 2 + 3} ${L - 5}H${hm / 2 - 3}"/>`;
  return { s, ty: (250 - L * s) / 2 + 2, gx: (sw + slw) * s + 6, gy: 0, body, gyFrom: L };
}
};

function pv(key, v, cls) {
  const id = "pv" + (++UID), M = MODELS[key], b = PVS[key](v, id);
  const gy = b.ty + b.gyFrom * b.s + 9;
  return `<svg class="pv ${cls || ""}" viewBox="0 0 200 250" role="img" aria-label="Aperçu : ${esc(M.n)}">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--fab1)"/><stop offset="1" stop-color="var(--fab2)"/>
    </linearGradient>
    <pattern id="${id}h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="var(--pvh)" stroke-width="1.2"/>
    </pattern>
  </defs>
  <ellipse cx="100" cy="${r1(gy)}" rx="${r1(b.gx)}" ry="${r1(b.gx * .13)}" fill="var(--ink)" opacity=".08"/>
  <g transform="translate(100,${r1(b.ty)}) scale(${r1(b.s * 100) / 100})">${b.body}</g>
</svg>`;
}

/* mini-svg d'une pièce (cartes patron, panier, tray) */
function pieceSvg(p, idp, opts) {
  const o = opts || {}, pad = 4, id = "ps" + (++UID);
  const w = p.w + pad * 2, h = p.h + pad * 2;
  return `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" aria-hidden="true">
  <defs><marker id="${id}a" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4.6" markerHeight="4.6" orient="auto-start-reverse">
    <path d="M0 1L5 3L0 5Z" fill="var(--mute)"/></marker></defs>
  <g transform="translate(${pad},${pad})">
    <path d="${p.d}" ${p.hole ? 'fill-rule="evenodd"' : ""} fill="var(--chalk-soft)" stroke="var(--ink)" stroke-width="${o.thin ? .35 : .8}" stroke-linejoin="round"/>
    ${p.fold ? `<line x1=".7" y1="1.4" x2=".7" y2="${r1(p.h - 1.4)}" stroke="var(--chalk)" stroke-width="${o.thin ? .3 : .7}" stroke-dasharray="1.8 1.3"/>` : ""}
    ${o.grain ? `<line x1="${r1(p.w * .6)}" y1="${r1(Math.min(4, p.h * .16))}" x2="${r1(p.w * .6)}" y2="${r1(p.h - Math.min(4, p.h * .16))}" stroke="var(--mute)" stroke-width="${o.thin ? .3 : .55}" marker-start="url(#${id}a)" marker-end="url(#${id}a)"/>` : ""}
  </g>
</svg>`;
}
/* ============ ÉTAT ============ */
let cur = "droite", sa = 1, Wf = 140, z = 1,
    cut = new Set(), lay = null, busy = false, cuttingAll = false,
    astep = 0, playT = null, joinT = null, methDone = new Set();

const gen = () => { // pièces expansées (quantités incluses, libellées)
  const out = [];
  MODELS[cur].g(m).forEach(p => { for (let i = 0; i < (p.q || 1); i++) out.push({ ...p, lbl: p.n + ((p.q || 1) > 1 ? " " + (i + 1) + "/" + p.q : "") }); });
  return out;
};

/* ============ TOAST ============ */
let toastT = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ============ MESURES ============ */
const FIELDS = [
  ["P", "Tour de poitrine", 80, 140],
  ["T", "Tour de taille", 55, 125],
  ["H", "Tour de hanches", 80, 155],
  ["L", "Longueur totale", 25, 165],
  ["S", "Longueur de manche", 10, 78],
  ["C", "Carrure épaules", 30, 56]];

function renderInputs() {
  $("#fi").innerHTML = FIELDS.map(([k, lab]) => `
    <div class="field" data-k="${k}">
      <label for="in-${k}">${lab}<em>cm</em></label>
      <div class="stp">
        <button type="button" data-d="-1" data-k="${k}" aria-label="Diminuer ${lab}">−</button>
        <input id="in-${k}" inputmode="decimal" value="${m[k]}" aria-label="${lab} en centimètres">
        <button type="button" data-d="1" data-k="${k}" aria-label="Augmenter ${lab}">+</button>
      </div>
    </div>`).join("");
  $$("#fi .stp button").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.k, f = FIELDS.find(x => x[0] === k),
          cur0 = parseFloat(String($("#in-" + k).value).replace(",", ".")) || m[k];
    setM(k, cur0 + (+b.dataset.d) * (k === "L" ? 2 : 1), f);
  }));
  FIELDS.forEach(([k]) => $("#in-" + k).addEventListener("change", e => setM(k, e.target.value, FIELDS.find(x => x[0] === k))));
}
function setM(k, v, f) {
  if ($("#in-" + k).disabled) return;
  v = parseFloat(String(v).replace(",", "."));
  if (isNaN(v)) { warn("Mesure invalide : " + f[1].toLowerCase() + "."); $("#in-" + k).value = m[k]; return; }
  m[k] = Math.min(f[3], Math.max(f[2], v));
  $("#in-" + k).value = m[k];
  hideWarn(); regen();
}
function warn(msg) { const w = $("#wr"); w.textContent = "⚠ " + msg; w.classList.remove("hidden"); }
function hideWarn() { $("#wr").classList.add("hidden"); }
function updateFieldAvail() {
  const use = MODELS[cur].use;
  FIELDS.forEach(([k]) => {
    const on = use.includes(k);
    $("#in-" + k).disabled = !on;
    $("#fi .field[data-k='" + k + "']").classList.toggle("off", !on);
    $("#fi .field[data-k='" + k + "']").title = on ? "" : "Non utilisé pour ce modèle";
  });
}

/* ============ CARTES MODÈLES ============ */
function renderMods() {
  $("#mods").innerHTML = Object.keys(MODELS).map(k => {
    const M = MODELS[k];
    return `<button class="mod ${k === cur ? "on" : ""}" data-k="${k}" aria-pressed="${k === cur}">
      <span class="chk">✓</span>
      ${pv(k, { ...m, L: M.L, S: 58 })}
      <span class="cat">${M.cat} · ${M.dif === 1 ? "facile" : M.dif === 2 ? "intermédiaire" : "confirmé"}</span>
      <b>${M.n}</b>
      <span class="dif" title="Difficulté">${[1, 2, 3].map(i => `<i class="${i <= M.dif ? "f" : ""}"></i>`).join("")}</span>
    </button>`;
  }).join("");
  $$("#mods .mod").forEach(b => b.addEventListener("click", () => selectModel(b.dataset.k)));
}
function selectModel(k) {
  if (cur === k && lay) return;
  cur = k; m.L = MODELS[k].L;
  $("#in-L").value = m.L;
  cut.clear(); astep = 0; methDone.clear();
  stopPlay();
  updateFieldAvail();
  $("#fold-note").textContent = "Pliage : " + MODELS[k].fold;
  renderMods(); renderApercu(); renderMeth(); renderAsm();
  regen();
}

/* ============ APERÇU & STYLE ============ */
const dots = d => `<span class="dots">${[1, 2, 3].map(i => `<i class="${i <= d ? "f" : ""}"></i>`).join("")}</span>`;
function renderApercu() {
  const M = MODELS[cur], n = gen().length;
  $("#apv").innerHTML = `
    <div class="apv-stage">${pv(cur, m, "pv-l")}</div>
    <div class="apv-info">
      <p class="kicker">${M.cat} — le vêtement obtenu</p>
      <h3>${M.n}</h3>
      <p class="desc">${M.desc}</p>
      <div class="tags">${M.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      <div class="specs">
        <div><span>Difficulté</span><b>${dots(M.dif)}</b></div>
        <div><span>Pièces</span><b>${n}</b></div>
        <div><span>Métrage estimé</span><b id="sp-met">—</b></div>
        <div><span>Laize conseillée</span><b>${M.laize} cm</b></div>
        <div class="wide"><span>Tissu conseillé</span><b>${M.tis}</b></div>
      </div>
    </div>`;
}

/* ============ PIÈCES DU PATRON ============ */
function renderPieces() {
  const list = gen();
  $("#pcs-n").textContent = list.length + " pièces · tailles calculées sur vos mesures";
  $("#pcs").innerHTML = list.map((p, i) => `
    <div class="pcard ${cut.has(i) ? "done" : ""}">
      <div class="pthumb">${pieceSvg(p, "", { grain: 1 })}</div>
      <div class="pmeta">
        <b>${p.lbl}</b>
        <span>${fr(r1(p.w))} × ${fr(r1(p.h))} cm</span>
        <div class="badges">
          ${p.fold ? '<span class="badge">sur pli</span>' : ""}
          ${p.pair ? '<span class="badge alt">miroir ×' + p.q + "</span>" : ""}
          ${p.hole ? '<span class="badge alt">trou de taille Ø ' + fr(r1(p.hole * 2)) + "</span>" : ""}
        </div>
      </div>
    </div>`).join("");
}
/* ============ PLAN DE COUPE (placé + ciseaux) ============ */
function layout() {
  const list = gen();
  const placed = list.map((p, i) => ({ ...p, i }));
  placed.sort((a, b) => b.h - a.h);
  let x = 0, y = 0, rh = 0, overflow = null;
  placed.forEach(p => {
    const bw = p.w + 2 * sa, bh = p.h + 2 * sa;
    if (bw > Wf && overflow === null) overflow = p.lbl;
    if (x + bw > Wf && x > 0) { x = 0; y += rh + 1.5; rh = 0; }
    p.x = r1(x + sa); p.y = r1(y + sa);
    x += bw + 1.5; rh = Math.max(rh, bh);
  });
  lay = { placed, len: r1(y + rh + sa), overflow };
}
const metM = () => Math.ceil(lay.len / 5) / 20;

function buildBoard() {
  layout();
  const W = Math.max(Wf, 60), H = Math.max(lay.len, 24);
  let tickH = "", tickV = "", labH = "", labV = "";
  for (let x = 10; x < W; x += 10) tickH += `M${x} 0V${x % 50 ? 3 : 5.5}`;
  for (let y = 10; y < H; y += 10) tickV += `M0 ${y}H${y % 50 ? 3 : 5.5}`;
  for (let x = 50; x < W; x += 50) labH += `<text x="${x}" y="9" text-anchor="middle">${x}</text>`;
  for (let y = 50; y < H; y += 50) labV += `<text x="9" y="${y + 1}" text-anchor="middle" transform="rotate(-90 9 ${y + 1})">${y}</text>`;
  const pieces = lay.placed.map(p => {
    const c = cut.has(p.i), fe = p.hole ? 'fill-rule="evenodd" ' : "";
    return `<g class="bp${c ? " cut" : ""}" data-i="${p.i}" transform="translate(${p.x},${p.y})">
    <path class="bf" ${fe}d="${p.d}"/>
    <path class="bo" ${fe}d="${p.d}"/>
    <path class="bc" pathLength="1" ${fe}d="${p.d}"/>
    ${p.fold ? `<line class="fold" x1=".8" y1="1.5" x2=".8" y2="${r1(p.h - 1.5)}"/><text class="fl" x="2.4" y="${r1(p.h / 2)}" transform="rotate(-90 2.4 ${r1(p.h / 2)})">pli</text>` : ""}
    <line class="grain" x1="${r1(p.w * .62)}" y1="${r1(Math.min(4.5, p.h * .16))}" x2="${r1(p.w * .62)}" y2="${r1(p.h - Math.min(4.5, p.h * .16))}"/>
    <text class="bl" x="${r1(p.w / 2)}" y="${r1(p.h / 2 + 1)}">${p.lbl}</text>
  </g>`;
  }).join("");
  $("#tb").innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:${r1(100 * z)}%" aria-label="Plan de coupe sur laize de ${Wf} cm">
  <defs>
    <pattern id="wv" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="var(--table)"/>
      <path d="M0 2H8M0 6H8" stroke="var(--table2)" stroke-width=".7"/>
      <path d="M2 0V8M6 0V8" stroke="var(--table2)" stroke-width=".45" opacity=".6"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wv)"/>
  <g class="ruler"><path d="${tickH}"/><path d="${tickV}"/>${labH}${labV}</g>
  <line class="selv" x1=".6" y1="0" x2=".6" y2="${H}"/>
  <line class="selv" x1="${W - .6}" y1="0" x2="${W - .6}" y2="${H}"/>
  ${pieces}
</svg>`;
  $$("#tb .bp").forEach(g => g.addEventListener("click", () => doCut(+g.dataset.i)));
  updateMet(); renderProg();
}

function updateMet() {
  const el = $("#sp-met"), met = fr(r1(metM() * 100) / 100);
  if (el) el.textContent = "≈ " + met + " m";
  const b = $("#met");
  const all = lay.placed.length;
  if (cut.size === all && all > 0) {
    b.innerHTML = "✂&ensp;Coupe terminée — métrage utilisé : ≈ <strong>" + met + " m</strong> × " + Wf + " cm de laize";
    b.classList.remove("hidden");
  } else b.classList.add("hidden");
  const w2 = $("#wr2");
  if (lay.overflow) { w2.textContent = "⚠ " + lay.overflow + " est plus large que la laize (" + Wf + " cm) — augmentez la laize."; w2.classList.remove("hidden"); }
  else w2.classList.add("hidden");
}

function renderProg() {
  const all = lay.placed.length;
  $("#prog-i").style.width = (all ? (cut.size / all * 100) : 0) + "%";
  $("#prog-t").textContent = cut.size + " / " + all + " pièces";
}

function doCut(i) {
  if (busy || cuttingAll || cut.has(i)) return;
  busy = true;
  const g = document.querySelector('#tb .bp[data-i="' + i + '"]');
  if (g) requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("go")));
  setTimeout(() => {
    cut.add(i); busy = false;
    buildBoard(); renderPieces(); renderTray();
    if (cut.size === lay.placed.length) toast("Coupe terminée — à vous la couture !");
  }, 1120);
}

function cutAll() {
  if (busy || cuttingAll) return;
  if (cut.size === lay.placed.length) { toast("Toutes les pièces sont déjà coupées."); return; }
  cuttingAll = true;
  $$("#tb .bp").forEach((g, idx) => {
    const i = +g.dataset.i;
    if (!cut.has(i)) setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("go"))), idx * 130);
  });
  setTimeout(() => {
    lay.placed.forEach(p => cut.add(p.i));
    cuttingAll = false;
    buildBoard(); renderPieces(); renderTray();
    toast("Coupe terminée — à vous la couture !");
  }, $$("#tb .bp").length * 130 + 1150);
}

function renderTray() {
  const list = gen();
  const done = [...cut].sort((a, b) => a - b).map(i => list[i]).filter(Boolean);
  $("#tray").innerHTML = done.map((p, k) =>
    `<span class="mini" title="${esc(p.lbl)}" style="animation-delay:${Math.min(k * 40, 400)}ms">${pieceSvg(p, "", { thin: 1 })}</span>`).join("");
}

/* ============ MÉTHODE DE COUPE ============ */
function renderMeth() {
  const M = MODELS[cur];
  $("#meth").innerHTML = M.meth.map((s, i) => `
    <li class="${methDone.has(i) ? "ok" : ""}" data-i="${i}" role="checkbox" aria-checked="${methDone.has(i)}" tabindex="0">
      <span class="cb">✓</span><span class="tx"><b>${String(i + 1).padStart(2, "0")}</b>${s}</span>
    </li>`).join("");
  $$("#meth li").forEach(li => {
    const toggle = () => {
      const i = +li.dataset.i;
      methDone.has(i) ? methDone.delete(i) : methDone.add(i);
      li.classList.toggle("ok"); li.setAttribute("aria-checked", methDone.has(i));
      const p = methDone.size / MODELS[cur].meth.length;
      $("#ring-f").style.strokeDashoffset = r1(119.4 * (1 - p));
      $("#ring-t").textContent = Math.round(p * 100) + " %";
    };
    li.addEventListener("click", toggle);
    li.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
  });
  $("#ring-f").style.strokeDashoffset = 119.4 * (1 - (methDone.size / M.meth.length));
  $("#ring-t").textContent = Math.round(methDone.size / M.meth.length * 100) + " %";
}

/* ============ RÉGÉNÉRATION GLOBALE ============ */
function regen() {
  cut.clear();
  buildBoard(); renderPieces(); renderTray(); renderProg(); updateMet();
  showStep();
}
/* ============ ASSEMBLAGE ILLUSTRÉ ============ */
/* Chaque étape est une scène en images : les pièces s'écartent, la couture se trace,
   puis les pièces se rejoignent comme sur la table de couture. La dernière étape
   révèle le vêtement fini et son style. */
function sceneSVG(o) {
  const list = gen(), gap = 13, pad = 9;
  const A = list[o.p[0]], B = o.p[1] != null ? list[o.p[1]] : null;
  const els = [], bounds = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  let seam = null, crease = null, ov = null;
  let Ax = pad, Ay = pad;
  const add = (p, x0, y0, x1, y1, flip, lm) => {
    els.push({ p, x0, y0, x1, y1, flip, lm });
    [[x0, y0], [x1, y1]].forEach(([x, y]) => {
      const l = flip === "x" ? x - p.w : x, r = flip === "x" ? x : x + p.w,
            t = flip === "y" ? y - p.h : y, b = flip === "y" ? y : y + p.h;
      bounds.x0 = Math.min(bounds.x0, l); bounds.x1 = Math.max(bounds.x1, r);
      bounds.y0 = Math.min(bounds.y0, t); bounds.y1 = Math.max(bounds.y1, b);
    });
  };
  if (o.k === "fin") {
    add(A, pad, pad, pad, pad, null, "above");
    ov = `<g transform="translate(${pad},${pad})"><path class="ov" ${A.hole ? 'fill-rule="evenodd" ' : ""}d="${A.d}"/></g>`;
  } else if (o.k === "rl" || o.k === "rr" || o.k === "ll") {
    if (o.k === "ll") Ax = pad + B.w + gap;
    add(A, Ax, Ay, Ax, Ay, null, "above");
    if (o.k === "rl") add(B, Ax + A.w + gap, Ay, Ax + A.w, Ay, null, "above");
    if (o.k === "rr") add(B, Ax + A.w + gap + B.w, Ay, Ax + A.w + B.w, Ay, "x", "above");
    if (o.k === "ll") add(B, Ax - gap, Ay, Ax, Ay, "x", "above");
    const sx = o.k === "ll" ? Ax : Ax + A.w;
    seam = { x1: sx, y1: Ay + 1, x2: sx, y2: Ay + Math.min(A.h, B.h) - 1 };
  } else if (o.k === "tt" || o.k === "bt") {
    if (o.k === "tt") Ay = pad + B.h + gap;
    add(A, Ax, Ay, Ax, Ay, null, o.k === "tt" ? "below" : "above");
    if (o.k === "tt") add(B, Ax, Ay - gap, Ax, Ay, "y", "above");
    else add(B, Ax, Ay + A.h + gap, Ax, Ay + A.h, null, "below");
    const sy = o.k === "tt" ? Ay : Ay + A.h;
    seam = { x1: Ax + 1, y1: sy, x2: Ax + Math.min(A.w, B.w) - 1, y2: sy };
  } else if (o.k === "hem") {
    const st = { n: "Repli", d: rectD(A.w * .94, 3.4), w: r1(A.w * .94), h: 3.4 };
    add(A, pad, pad, pad, pad, null, "above");
    add(st, pad, Ay + A.h + gap, pad, Ay + A.h - 3.2, null, "below");
    crease = { x1: pad + 1.5, y1: Ay + A.h - 3.2, x2: pad + A.w * .94 - 1.5, y2: Ay + A.h - 3.2 };
  }
  bounds.y0 -= 7; bounds.x0 -= 2; bounds.x1 += 2; bounds.y1 += 2;
  const uw = bounds.x1 - bounds.x0, uh = bounds.y1 - bounds.y0,
        maxS = uh < 34 ? 3.1 : uh < 80 ? 2.6 : 2.05,
        s = Math.min(maxS, 336 / uw, 226 / uh),
        tx = (360 - uw * s) / 2 - bounds.x0 * s,
        ty = (250 - uh * s) / 2 - bounds.y0 * s;
  const elsSvg = els.map(e => `
    <g class="pz" style="transform:translate(${r1(e.x0)}px,${r1(e.y0)}px)" data-j="translate(${r1(e.x1)}px,${r1(e.y1)}px)">
      ${e.flip ? '<g class="fx">' : ""}<path class="sp" ${e.p.hole ? 'fill-rule="evenodd" ' : ""}d="${e.p.d}"/>${e.flip ? "</g>" : ""}
    </g>`).join("");
  const labs = els.map(e => {
    const left = e.flip === "x" ? e.x1 - e.p.w : e.x1,
          top = e.flip === "y" ? e.y1 - e.p.h : e.y1,
          cx = left + e.p.w / 2,
          cy = e.lm === "below" ? top + e.p.h + 5.5 : top - 2.5;
    return `<text class="lb" x="${r1(cx)}" y="${r1(cy)}">${e.p.lbl}</text>`;
  }).join("");
  const seamSvg = seam ? `<line class="sm" x1="${r1(seam.x1)}" y1="${r1(seam.y1)}" x2="${r1(seam.x2)}" y2="${r1(seam.y2)}"/>` : "";
  const creaseSvg = crease ? `<line class="cr" x1="${r1(crease.x1)}" y1="${r1(crease.y1)}" x2="${r1(crease.x2)}" y2="${r1(crease.y2)}"/>` : "";
  const did = "dg" + (++UID);
  return `<svg class="ascn" viewBox="0 0 360 250" role="img" aria-label="Assemblage : ${esc(o.t)}">
  <defs><pattern id="${did}" width="14" height="14" patternUnits="userSpaceOnUse"><circle class="dotbg" cx="2" cy="2" r="1.1"/></pattern></defs>
  <rect width="360" height="250" fill="url(#${did})"/>
  <g transform="translate(${r1(tx)},${r1(ty)}) scale(${r1(s * 100) / 100})">${elsSvg}${ov}${labs}${seamSvg}${creaseSvg}</g>
</svg>`;
}

function showStep() {
  const ops = MODELS[cur].st;
  if (astep >= ops.length) astep = ops.length - 1;
  if (astep < 0) astep = 0;
  const o = ops[astep];
  clearTimeout(joinT);
  $$("#a-steps li").forEach((li, i) => { li.classList.toggle("on", i === astep); li.classList.toggle("done", i < astep); });
  $("#a-cnt").textContent = (astep + 1) + " / " + ops.length;
  const stage = $("#asm-stage");
  if (o.k === "final") {
    stage.innerHTML = pv(cur, m, "pv rv");
    $("#a-title").textContent = "Aperçu final";
    $("#a-desc").textContent = "Toutes les pièces sont assemblées : voici le vêtement et le style que vous obtiendrez, tracé d'après vos propres mesures.";
    $("#a-final").classList.remove("hidden");
    $("#a-final").textContent = MODELS[cur].n + " — " + MODELS[cur].tags.join(", ") + ". Tissu conseillé : " + MODELS[cur].tis + ".";
    return;
  }
  $("#a-final").classList.add("hidden");
  stage.innerHTML = sceneSVG(o);
  $("#a-title").textContent = o.t;
  $("#a-desc").textContent = o.d;
  joinT = setTimeout(() => {
    const s = stage.querySelector("svg");
    if (!s) return;
    s.classList.add("jd");
    stage.querySelectorAll(".pz").forEach(g => { g.style.transform = g.dataset.j; });
  }, 430);
}

function renderAsm() {
  const ops = MODELS[cur].st;
  $("#a-steps").innerHTML = ops.map((o, i) =>
    `<li data-i="${i}"><i>${i + 1}</i><span>${o.k === "final" ? "Aperçu final" : o.t}</span></li>`).join("");
  $$("#a-steps li").forEach(li => li.addEventListener("click", () => { stopPlay(); astep = +li.dataset.i; showStep(); }));
  astep = 0;
  showStep();
}

function aNav(d) {
  const ops = MODELS[cur].st, n = astep + d;
  if (n < 0 || n >= ops.length) return;
  stopPlay(); astep = n; showStep();
}
function stopPlay() {
  if (playT) { clearInterval(playT); playT = null; }
  const b = $("#btn-play");
  b.classList.remove("playing"); b.textContent = "▶ Lecture";
}
function togglePlay() {
  if (playT) { stopPlay(); return; }
  const b = $("#btn-play");
  b.classList.add("playing"); b.textContent = "⏸ Pause";
  playT = setInterval(() => {
    const ops = MODELS[cur].st;
    if (astep >= ops.length - 1) { stopPlay(); return; }
    astep++; showStep();
  }, 2700);
}

/* ============ CLIENTS (localStorage) ============ */
const LSCL = "atelier-cl";
const loadClients = () => { try { return JSON.parse(localStorage.getItem(LSCL)) || []; } catch (e) { return []; } };
function renderClients() {
  const cls = loadClients();
  $("#cl").innerHTML = '<option value="">Client…</option>' +
    cls.map((c, i) => `<option value="${i}">${esc(c.n)}</option>`).join("");
}
function saveClient() {
  const n = $("#nm").value.trim();
  if (!n) { toast("Donnez un nom au client avant d'enregistrer."); return; }
  const cls = loadClients();
  const rec = { n, P: m.P, T: m.T, H: m.H, L: m.L, S: m.S, C: m.C };
  const ex = cls.findIndex(c => c.n.toLowerCase() === n.toLowerCase());
  if (ex >= 0) cls[ex] = rec; else cls.push(rec);
  try { localStorage.setItem(LSCL, JSON.stringify(cls)); } catch (e) {}
  $("#nm").value = "";
  renderClients();
  $("#cl").value = ex >= 0 ? ex : cls.length - 1;
  toast("Client enregistré — " + n);
}
function applyClient() {
  const v = $("#cl").value;
  if (v === "") return;
  const c = loadClients()[+v];
  if (!c) return;
  ["P", "T", "H", "L", "S", "C"].forEach(k => { m[k] = c[k]; $("#in-" + k).value = c[k]; });
  hideWarn(); regen();
  toast("Mensurations de " + c.n + " chargées.");
}

/* ============ THÈME ============ */
const LSTH = "atelier-theme";
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(LSTH, t); } catch (e) {}
}
function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

/* ============ INITIALISATION ============ */
function init() {
  let t0 = "light";
  try { t0 = localStorage.getItem(LSTH) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch (e) {}
  applyTheme(t0);
  renderInputs();
  renderMods();
  renderClients();
  updateFieldAvail();
  $("#fold-note").textContent = "Pliage : " + MODELS[cur].fold;
  renderApercu(); renderMeth(); renderAsm(); regen();

  $("#th").addEventListener("click", toggleTheme);
  $("#sv").addEventListener("click", saveClient);
  $("#cl").addEventListener("change", applyClient);
  $("#a-prev").addEventListener("click", () => aNav(-1));
  $("#a-next").addEventListener("click", () => aNav(1));
  $("#btn-play").addEventListener("click", togglePlay);
  $("#all").addEventListener("click", cutAll);
  $("#rs").addEventListener("click", () => { cut.clear(); buildBoard(); renderPieces(); renderTray(); toast("Plan de coupe réinitialisé."); });
  $("#zo").addEventListener("click", () => { z = Math.max(.5, z - .2); buildBoard(); });
  $("#zi").addEventListener("click", () => { z = Math.min(2.6, z + .2); buildBoard(); });
  $("#zr").addEventListener("click", () => { z = 1; buildBoard(); });
  $("#W").addEventListener("change", e => {
    const v = parseFloat(String(e.target.value).replace(",", "."));
    if (!isNaN(v) && v >= 60 && v <= 320) { Wf = v; regen(); } else e.target.value = Wf;
  });
  $("#M").addEventListener("change", e => {
    const v = parseFloat(String(e.target.value).replace(",", "."));
    if (!isNaN(v) && v >= .3 && v <= 4) { sa = v; regen(); } else e.target.value = sa;
  });
  document.addEventListener("keydown", e => {
    if (e.target.matches("input,select,textarea")) return;
    if (e.key === "ArrowRight") aNav(1);
    else if (e.key === "ArrowLeft") aNav(-1);
  });
}
init();
