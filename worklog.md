# Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: Créer l'application "Atelier – coupe du tissu" en version Ultra Premium, avec un assemblage des pièces coupées illustré en images et un aperçu du vêtement/style obtenu.

Work Log:
- Reconstruit l'application en un fichier unique `/home/z/my-project/download/atelier-coupe.html` (HTML + CSS + JS vanilla, sans dépendance de build).
- Design system premium : typographie éditoriale Fraunces + Outfit, palette ivoire/encre/rose craie, thème clair & sombre persistés, micro-interactions, responsive (testé 1280 px et 390 px, zéro débordement).
- 7 modèles paramétriques (jupe droite, cercle, mouchoir, short, tunique, haut, blazer) : chaque modèle génère ses pièces de patron en SVG par formules de coupage (poitrine/taille/hanches/longueur/manche/carrure), avec marqueurs pli/miroir/trou de taille.
- NOUVEAU — Aperçu du vêtement & style : chaque modèle possède un dessin SVG du vêtement fini calculé sur les mesures réelles (section 02 « Aperçu & style » avec description du style, tags, difficulté, pièces, métrage estimé, laize et tissu conseillés) ; les cartes modèles 01 réutilisent ces silhouettes.
- Plan de coupe : algorithme de placé (tri hauteur + rangées first-fit) sur laize réglable avec marge couture, texture tissu, règles graduées, lisières, flèches de droit-fil, animation ciseaux (trait rose craie qui trace le contour via pathLength/dashoffset), panier de pièces coupées, barre de progression, bannière de métrage, zoom, « Tout couper ».
- NOUVEAU — Assemblage illustré en images (section 07) : moteur de scènes SVG animées — chaque étape montre les pièces écartées qui se rejoignent (types de coutures rr/ll/rl/tt/bt avec retournement miroir pour « endroit contre endroit », repli d'ourlet animé, surjet en pointe qui coulisse), ligne de couture rose craie, navigation par étapes (liste latérale, boutons, lecture auto, flèches clavier), et dernière étape « Aperçu final » révélant le vêtement fini + résumé du style.
- Méthode de coupe : checklist par modèle avec anneau de progression.
- Clients : enregistrement/chargement localStorage (clé « atelier-cl »), mesures invalides signalées.
- QA : syntaxe validée (node --check), tests headless Playwright (interaction coupe, navigation assemblage, aperçu final, changement de modèle, thème, tout couper) — 0 erreur console après correction d'un bug `o.final` vs `o.k === "final"` et de l'écart ceinture/corps de la jupe droite.

Stage Summary:
- Livrable : `/home/z/my-project/download/atelier-coupe.html` (fichier unique autonome, ~60 Ko, fonts Google uniquement).
- Fonctionnalités complètes + les deux demandes clés : assemblage en images animé et aperçu du vêtement/style obtenu.
- Scripts de test réutilisables dans `/home/z/my-project/scripts/` (extract.js, test-render.js, test-shots.js, test-mobile.js).

---
Task ID: 2
Agent: Super Z (main)
Task: Transformer l'app en produit full-stack Next.js avec backend + landing ultra premium — puis, sur demande : supprimer « Méthode de coupe » et « Pièces coupées », renforcer le montage jusqu'au produit fini porté sur mannequin, préciser les coutures (bords, ordre).

Work Log:
- Backend : schéma Prisma `Client` (name, P, T, H, L, notes, timestamps) poussé sur SQLite ; API REST `/api/clients` (GET liste, POST création) et `/api/clients/[id]` (GET, PUT, DELETE) avec validation zod (plages 60–160 / 40–160 / 60–180 / 10–200) — CRUD testé par curl (201/200/400/404/200).
- Moteur de patronage étendu de 7 → 17 modèles (droite, crayon, évasée, cercle, mouchoir, portefeuille, plissée, short, pantalon, pantalon large, tee-shirt, tunique, blouse, robe trapèze, blazer, kimono, étude de manche) avec familles (Jupes/Pantalons/Hauts/Vestes & robes/Bases), description, tags, difficulté, tissu conseillé, pliage (FOLD) et séquences de montage (ASM) par modèle.
- Moteur d'aperçu vêtement (`src/lib/atelier/preview.ts`) : silhouettes paramétriques P·T·H·L dessinées à plat (moitié de tour), ombre au sol, détails par style (ceinture, fente, croisé, plis, drapés, col châle + boutonnière + poches, manches angulées, kimono en T, mouchoir en losange) ; composant `GarmentPreview` utilisé dans l'atelier (carte « Aperçu & style » temps réel), dans le catalogue de la landing et dans le héros.
- Montage visuel cumulatif (`assembly-player.tsx` refondu) : scène SVG où les pièces réelles s'accumulent (moteur de placement ll/rr/rl/tt/bt/ct avec occurrences « ·2 », pièces en attente estompées, préparation surlignée), coutures numérotées (ligne rose + points de piqûre + badge n°), chip « Couture n°X » précisant les bords à réunir (ex. « bord droit du devant ↔ bord gauche du dos, à 1,5 cm »), navigation Précédent/Suivant/Rejouer + flèches clavier + points d'étape.
- Mannequin de couturier (`mannequin.tsx`) : dernière carte du montage = produit fini PORTÉ — buste (encolure, pommeau, épaules, poitrine, taille, hanches) sur pied de lampadaire, vêtement posé dessus à l'échelle des mesures, tags du style.
- Supprimé à la demande : section « Méthode de coupe pas à pas » (buildMethod + MethodCard) et section « Pièces coupées » (panier) ; l'atelier enchaîne plan de coupe → aperçu & style → nomenclature → montage.
- Landing ultra premium (`landing.tsx`) : nav sticky, héros éditorial (Fraunces italique, dégradés, grain, patrons papier flottants animés, aperçu robe trapèze), bandeau marquee des 17 modèles, 6 cartes savoir-faire, catalogue filtrable par famille (17 cartes avec aperçus colorés, clic = ouvre l'atelier sur ce modèle), fonctionnement en 4 étapes, CTA sombre, footer (sticky, safe-area). Navigation landing ↔ atelier par hash (#/atelier) via `app-shell.tsx` (transitions AnimatePresence).
- Fiches clientes branchées sur le backend : GET au montage, POST/PUT selon sélection, DELETE, toasts succès/erreur, état busy ; libellés « Mesures conservées en base de données ».
- Typo : Fraunces ajouté (next/font, normal + italique) en police éditoriale ; globals.css : keyframes asmpulse + marquee, scroll fluide, grain héros.
- QA : ESLint 0 erreur (anciens scripts HTML supprimés), serveur 200, API CRUD vérifiée, agent-browser vérifié sur desktop 1440 px et mobile 390 px + dark mode : héros, catalogue (correction des proportions jupes : hem dessiné à ±hem et non ±hem/2, largeur spec = 2×hem), coupe animée (1/3 après clic pièce), montage kimono (pièce en T + devants miroir), produit fini sur mannequin, fiche cliente « Camille Dubois » créée via l'UI et retrouvée en base, navigation Accueil ↔ atelier — 0 erreur console.

Stage Summary:
- App full-stack Next.js 16 : landing premium + atelier de coupe 17 modèles + backend Prisma/SQLite (fiches clientes) sur la seule route `/` (+ routes API).
- Les 3 exigences clés sont couvertes : full stack avec backend, landing ultra premium professionnelle, visuel d'assemblage poussé jusqu'au vêtement porté sur mannequin avec coutures numérotées bord à bord.

---
Task ID: 3
Agent: Super Z (main)
Task: Audit complet + corriger « ça affiche toujours html au lieu du site » + introduire l'IA pour des visuels, pièces, tissus et produits finis réalistes.

Work Log:
- Audit : serveur Next.js 16 opérationnel (GET / 200), API clients OK, landing + atelier 17 modèles rendus ; l'ancien fichier HTML de /download était la cause du rendu « code brut » — l'app est désormais servie comme un vrai site (aperçu via panneau Preview / lien externe).
- Redémarrage du dev server requis après `db:push` pour recharger le client Prisma (db.aiVisual undefined → corrigé par restart via .zscripts/dev.sh).
- Prisma : nouveau modèle `AiVisual` (kind, sig unique = empreinte sha1 des paramètres, prompt, mime, data base64) poussé sur SQLite — cache persistant des visuels IA.
- Backend IA : `POST /api/ai/visual` (validation zod, 3 kinds : garment / fabric / pieces, génération via z-ai-web-dev-sdk `zai.images.generations.create`, tailles 864x1152 / 1024x1024 / 1152x864, cache par sig, nonce → variations) ; `GET /api/ai/visual/image/[sig]` sert le PNG (Content-Type, Cache-Control immutable).
- Lib `src/lib/ai/prompt.ts` : descripteurs anglais des 17 modèles, traduction des tissus conseillés (lin/soie/jersey/denim…), nom de couleur depuis le hex (teinte/saturation/luminosité → « teal », « pastel rose »…), qualificatif de longueur depuis L, prompts photoréalistes enrichis du code hex exact pour la fidélité colorimétrique.
- Frontend : nouveau composant `ai-studio.tsx` — section « Studio IA — visuels réalistes » dans l'atelier (après Aperçu & style) : 3 onglets (Produit fini sur mannequin / Texture du tissu / Pièces en situation), états idle + chargement (chronomètre, 20–60 s annoncées) + erreur avec réessai, image + badge « Généré par IA », bouton « Nouvelle variation » (nonce), prompt affiché en détail repliable, toast succès, reset chronomètre par onglet.
- Landing : nouvelle section « L'IA entre dans l'atelier » (id=ia) entre Fonctionnement et CTA final — 3 visuels photoréalistes pré-générés via CLI (public/ai/robe-ia.png, tissu-ia.png, pieces-ia.png), badges « Généré par IA », note Studio IA, lien « Visuels IA » dans la nav.
- QA : ESLint 0 erreur 0 warning ; curl API → génération 26 s puis cache instantané (cached:true), image PNG 116 Ko servie 200 ; agent-browser (1440 px + 390 px, clair + sombre) : section landing IA rendue avec images, génération produit fini / texture / pièces de bout en bout dans l'atelier (couleur teal fidèle au hex #2A9DB5), cache vérifié, 0 erreur console ; ancien cache pré-hex purgé (DELETE FROM AiVisual).

Stage Summary:
- L'IA est intégrée : 3 types de visuels photoréalistes (produit fini porté, texture de tissu, pièces en situation) générés côté backend avec cache en base, variations à volonté, fidélité au coloris via hex dans le prompt.
- Le site est bien servi par Next.js : l'utilisateur accède à l'app via le panneau Preview (plus de HTML brut).
- Fichiers clés : prisma/schema.prisma (AiVisual), src/app/api/ai/visual/* , src/lib/ai/prompt.ts, src/components/atelier/ai-studio.tsx, src/components/landing/landing.tsx (section IA), public/ai/*.png.
