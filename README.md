# Atelya — Créez • Mesurez • Réalisez

Application web de couture : à partir d'une photo, obtenez des variantes de vêtements générées par IA, le patronage sur vos mesures, et la méthode d'assemblage visuelle pas à pas pour réaliser l'habit.

**Parcours en trois gestes :** Le modèle (photo + variantes IA) → Le patronage (pièces numérotées, placement sur le tissu, métrage) → L'assemblage (schémas techniques : position des pièces, épingles, lignes de couture, pose de la ceinture…).

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

1. **Le modèle** — ouvrez l'atelier, prenez une photo ou choisissez l'exemple, saisissez les mesures (poitrine, taille, hanches…), générez 3 variantes IA du vêtement et sélectionnez celle que vous préférez.
2. **Le patronage** — l'application calcule les pièces du patron sur vos mesures : chaque pièce est dessinée à l'échelle, numérotée, avec les quantités, le placement sur la laize du tissu et le métrage total.
3. **L'assemblage** — suivez la méthode visuelle pas à pas : chaque étape montre les pièces réelles en position, les épingles, la ligne de couture à la bonne valeur, et les préparations (pinces, ourlets, fermetures, fronces). À la fin : votre vêtement.

## Notes

- **Variantes IA** : la génération d'images utilise le SDK `z-ai-web-dev-sdk`, disponible dans l'environnement d'exécution z.ai. En local, tout le parcours fonctionne, mais la génération des variantes IA nécessite cet environnement (les images déjà générées restent consultables depuis la base).
- **Base de données** : SQLite, fichier `db/custom.db` (aucun serveur de base de données à installer). Pour repartir de zéro : `npm run db:push`.
- **Port occupé ?** arrêtez le processus qui écoute le port 3000 ou lancez `npx next dev -p 3001` puis ouvrez http://localhost:3001.
- **Lint** : `npm run lint` pour vérifier la qualité du code.

## Structure du projet

```
prisma/schema.prisma          Modèle de données (clients, projets, visuels IA)
db/custom.db                  Base SQLite
src/app                       Pages et routes API (Next.js App Router)
src/components/atelier        Guide d'assemblage, schémas techniques, pièces
src/components/studio         Parcours de l'atelier (modèle, patronage, assemblage)
src/lib/atelier/patterns.ts   Moteur de patronage et données d'assemblage
```
