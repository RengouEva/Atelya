const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  page.on("pageerror", err => console.log("PAGEERROR:", err.message));
  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Étape 2 : couture rr en cours de jonction
  await page.locator("#a-next").click();
  await page.waitForTimeout(1150);
  await page.locator("#s-asm").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/home/z/my-project/scripts/asm-step2.png" });

  // Aperçu final
  await page.locator('#a-steps li[data-i="4"]').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/home/z/my-project/scripts/asm-final.png" });

  // Plan de coupe
  await page.locator("#s-coupe").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/home/z/my-project/scripts/board.png" });

  // Modèle blazer : aperçu + une scène
  await page.locator('#mods .mod[data-k="blazer"]').click();
  await page.waitForTimeout(600);
  await page.locator("#s-apercu").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/home/z/my-project/scripts/blazer-apercu.png" });

  await browser.close();
  console.log("captures OK");
})();
