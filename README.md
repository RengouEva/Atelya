# Atelya — Créez • Mesurez • Réalisez

Application web de couture : choisissez un modèle dans le catalogue validé par l'encadrement, obtenez le patronage ajusté à vos mesures, essayez le vêtement en 3D avec boutons, fermeture, ceinture et autres accessoires — puis suivez la méthode d'assemblage visuelle pas à pas pour réaliser l'habit.

**Parcours en quatre gestes :** Le modèle (catalogue par catégorie) → Le patronage (pièces numérotées, placement sur le tissu, métrage) → La confection 3D (essayage virtuel, accessoires, coloris du tissu) → L'assemblage (schémas techniques : position des pièces, épingles, lignes de couture…).

## Installation en local

### 1. Prérequis

- **Node.js 20 ou plus récent** — [nodejs.org](https://nodejs.org) (vérifiez avec `node --version`)
- Un gestionnaire de paquets : **npm** (inclus avec Node.js) ou **Bun** ([bun.sh](https://bun.sh))

### 2. Récupérer le projet

```bash
git clone https://github.com/RengouEva/Atelya.git
cd Atelya
```

### 3. Installer les dépendances

Avec npm :

```bash
npm install
```

Ou avec Bun :

```bash
bun install
```

### 4. Configurer la base de données

Un fichier `.env` est déjà fourni dans le dépôt (chemin de base de données portable, aucun réglage nécessaire). Pour créer la structure de la base :

```bash
npm run db:push
# ou : bun run db:push
```

> Un fichier `.env.example` sert de modèle si vous souhaitez recréer le `.env` à la main.

### 5. Lancer le site

```bash
npm run dev
# ou : bun run dev
```

Puis ouvrez **http://localhost:3000** dans votre navigateur.

## Utilisation

1. **Le modèle** — ouvrez l'atelier et choisissez un modèle dans le catalogue de l'encadrement, classé par catégorie (robe, jupe, pantalon, t-shirt, chemise, veste). Nommez votre projet et saisissez les mesures (poitrine, taille, hanches…).
2. **Le patronage** — les pièces définies par l'atelier pour ce modèle sont ajustées à vos mesures : chaque pièce est dessinée à l'échelle, numérotée, avec les quantités, le placement sur la laize du tissu et le métrage total.
3. **La confection 3D** — le vêtement prend vie sur un mannequin de couturier, dans le coloris de tissu choisi. Essayez les accessoires proposés (boutons, fermeture éclair, rivets, ceinture, poches, nœud) et faites tourner le mannequin : vous voyez le résultat avant la première coupe.
4. **L'assemblage** — suivez la méthode visuelle pas à pas définie par l'atelier : chaque étape montre les pièces réelles en position, les épingles, la ligne de couture à la bonne valeur, et les préparations (pinces, ourlets, fermetures, fronces). À la fin : votre vêtement.

## Espace atelier (catalogue validé par l'encadrement)

L'encadrement dispose d'un espace dédié : **http://localhost:3000/admin** (lien discret « Espace atelier » en bas de l'accueil). Un code d'accès y est demandé — par défaut `atelya-atelier`, modifiable dans le fichier `.env` (`ADMIN_CODE=…`).

Depuis cet espace, l'encadrement compose le **catalogue de modèles** :

- **Photo de référence** du vêtement (facultative — une illustration remplace la photo quand il n'y en a pas) ;
- **Catégorie** (robe, jupe, pantalon, t-shirt, chemise, veste) — changer de catégorie pré-remplit le formulaire avec le gabarit de l'atelier ;
- **Mesures de référence** du patronage et **forme 3D** (longueur, manches, col, coupe, évasement, ceinture) ;
- **Pièces du patronage** ajoutées manuellement : nom, silhouette du tracé, dimensions, quantité, au pli, note ;
- **Méthode d'assemblage** pas à pas : consigne, pièces en présence, type de jonction, détail de couture ;
- **Accessoires** proposés dans la confection 3D ;
- **Publication** : publié (visible des apprentis) ou brouillon.

Sept modèles de démonstration sont pré-chargés (un par catégorie, deux robes).

## Notes

- **Base de données** : SQLite, fichier `db/custom.db` (aucun serveur de base de données à installer). Pour repartir de zéro : `npm run db:push`.
- **Rendu 3D** : Three.js / react-three-fiber, entièrement côté navigateur — aucune clé API ni service externe requis.
- **Port occupé ?** arrêtez le processus qui écoute le port 3000 ou lancez `npx next dev -p 3001` puis ouvrez http://localhost:3001.
- **Lint** : `npm run lint` pour vérifier la qualité du code.

## Structure du projet

```
prisma/schema.prisma          Modèle de données (clients, modèles du catalogue, projets)
db/custom.db                  Base SQLite
src/app                       Pages et routes API (Next.js App Router)
src/app/admin                 Espace atelier : gestion du catalogue de modèles
src/components/atelier        Rendu 3D, guide d'assemblage, schémas techniques, pièces
src/components/studio         Parcours de l'atelier (catalogue, patronage, 3D, assemblage)
src/lib/atelier/patterns.ts   Moteur de patronage (tracés SVG, placement, métrage)
src/lib/atelier/garments.ts   Catalogue : catégories, accessoires, gabarits, mise à l'échelle
```
