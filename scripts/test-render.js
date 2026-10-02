// Test de rendu de l'app Atelier : erreurs console + interactions clés
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push("[console] " + msg.text()); });
  page.on("pageerror", err => errors.push("[pageerror] " + err.message));

  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const report = {};
  report.modeles = await page.locator("#mods .mod").count();
  report.apercuSVG = await page.locator("#apv svg").count();
  report.pieces = await page.locator("#pcs .pcard").count();
  report.boardPieces = await page.locator("#tb .bp").count();
  report.asmSteps = await page.locator("#a-steps li").count();
  report.meth = await page.locator("#meth li").count();
  report.metragetxt = await page.locator("#sp-met").textContent().catch(() => "n/a");

  // Coupe d'une pièce
  await page.locator("#tb .bp").first().click();
  await page.waitForTimeout(1400);
  report.trayAfterCut = await page.locator("#tray .mini").count();

  // Navigation assemblage : étape 2
  await page.locator("#a-next").click();
  await page.waitForTimeout(1200);
  report.asmSceneSvg = await page.locator("#asm-stage svg.ascn").count();
  report.asmJoined = await page.locator("#asm-stage svg.jd").count();
  report.asmCnt = (await page.locator("#a-cnt").textContent()).trim();

  // Dernière étape = aperçu final
  const n = report.asmSteps;
  for (let i = 0; i < n; i++) await page.locator("#a-next").click();
  await page.waitForTimeout(900);
  report.finalPreview = await page.locator("#asm-stage svg.pv").count();
  report.finalTitle = (await page.locator("#a-title").textContent()).trim();

  // Changement de modèle → cercle
  await page.locator('#mods .mod[data-k="cercle"]').click();
  await page.waitForTimeout(700);
  report.cerclePieces = await page.locator("#pcs .pcard").count();
  report.cercleSteps = await page.locator("#a-steps li").count();
  report.cercleMet = (await page.locator("#sp-met").textContent()).trim();

  // Thème sombre
  await page.locator("#th").click();
  await page.waitForTimeout(300);
  report.theme = await page.evaluate(() => document.documentElement.dataset.theme);

  // Tout couper
  await page.locator("#all").click();
  await page.waitForTimeout(2600);
  report.trayFull = await page.locator("#tray .mini").count();
  report.banner = await page.locator("#met:not(.hidden)").count();

  // Capture d'écran
  await page.locator("#th").click(); // retour clair
  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/home/z/my-project/scripts/atelier-top.png" });
  await page.locator("#s-asm").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/home/z/my-project/scripts/atelier-asm.png" });

  report.errors = errors;
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
