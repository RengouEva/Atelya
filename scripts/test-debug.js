const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", err => console.log("PAGEERROR:", err.message));
  await page.goto("file:///home/z/my-project/download/atelier-coupe.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const ops = MODELS[cur].st;
    return { cur, len: ops.length, last: JSON.stringify(ops[ops.length - 1]), ops: ops.map(o => ({ k: o.k, p: o.p, final: !!o.final })) };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
