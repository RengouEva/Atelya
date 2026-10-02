const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", err => { console.log("PAGEERROR:", err.message); console.log(err.stack); });
  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // aller directement à la dernière étape (final) via la liste latérale
  const n = await page.locator("#a-steps li").count();
  await page.locator(`#a-steps li[data-i="${n - 1}"]`).click();
  await page.waitForTimeout(800);
  console.log("final svg count:", await page.locator("#asm-stage svg").count());
  console.log("title:", await page.locator("#a-title").textContent());
  await browser.close();
})();
