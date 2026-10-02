const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/home/z/my-project/scripts/mobile-top.png" });
  await page.locator("#s-asm").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: "/home/z/my-project/scripts/mobile-asm.png" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log("scrollX overflow:", overflow, "errors:", errors.length ? errors : "aucune");
  await browser.close();
})();
