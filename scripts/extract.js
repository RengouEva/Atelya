// Vérification syntaxe du JS inline de l'app Atelier
const fs = require("fs");
const html = fs.readFileSync("/home/z/my-project/download/atelier-coupe.html", "utf8");
const m0 = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m0) { console.error("SCRIPT INTROUVABLE"); process.exit(1); }
fs.writeFileSync("/home/z/my-project/scripts/_inline.js", m0[1]);
console.log("Extrait :", m0[1].length, "caractères");
