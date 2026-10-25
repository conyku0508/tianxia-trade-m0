import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5174/";
const outputDir = process.env.ARTIFACT_DIR ?? "artifacts/art-release";
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const results = [];
try {
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } }),
      errors = [],
      badResponses = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400)
        badResponses.push({ url: r.url(), status: r.status() });
    });
    await page.goto(baseUrl + "?release=art-v1-20261026", {
      waitUntil: "networkidle",
    });
    for (const path of [
      "map",
      "market",
      "cargo",
      "intelligence",
      "route",
      "menu",
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("link", {
          name: {
            map: "地圖",
            market: "市場",
            cargo: "貨艙",
            intelligence: "情報",
            menu: "選單",
            route: "地圖",
          }[path],
          exact: false,
        })
        .click();
      if (path === "route") {
        await page.goto(baseUrl + "?release=art-v1-20261026#/route", {
          waitUntil: "networkidle",
        });
      }
      await page.evaluate(async () => {
        await Promise.all(
          [...document.images].map((i) => i.decode().catch(() => {})),
        );
        await document.fonts.ready;
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} ${path} overflow`,
      );
      const boxes = await page.evaluate(() => ({
        top: document.querySelector(".top").getBoundingClientRect().top,
        bottom: document.querySelector("nav").getBoundingClientRect().bottom,
        height: innerHeight,
        images: [...document.images].map((i) => ({
          src: i.currentSrc,
          loaded: i.complete && i.naturalWidth > 0,
        })),
      }));
      assert.equal(boxes.top, 0);
      assert.ok(boxes.bottom <= boxes.height + 1);
      assert.ok(boxes.images.every((i) => i.loaded));
      if (["market", "cargo", "intelligence"].includes(path)) {
        assert.ok(
          await page
            .locator(".scene-art")
            .evaluate((i) => i.naturalWidth > 1000),
        );
        assert.ok(
          await page
            .locator(".scene-art")
            .evaluate((i) => i.getBoundingClientRect().height > 180),
        );
      }
      if (path === "market") {
        assert.equal(await page.locator('[data-testid^="good-"]').count(), 30);
        await page
          .getByTestId("good-tea")
          .getByRole("button", { name: "買入", exact: true })
          .click();
        await page.getByLabel("交易數量", { exact: true }).fill("2");
        await page
          .getByRole("button", { name: "確認摘要", exact: true })
          .click();
        await page
          .getByRole("button", { name: "確認買入", exact: true })
          .click();
        assert.match(await page.getByTestId("money").innerText(), /4,244/);
      }
      if (path === "cargo") {
        for (const v of ["756", "720", "-36"])
          assert.ok((await page.locator("main").innerText()).includes(v));
      }
      if (path === "intelligence") {
        assert.equal(await page.locator(".known-label").count(), 2);
        assert.equal(await page.locator(".ledger-heading").count(), 2);
        assert.equal(await page.locator(".trend").count(), 2);
        const labels = await page
          .locator(".trend")
          .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
        assert.deepEqual(labels, [
          "第8天 470文，第10天 500文",
          "第7天 650文，第9天 680文",
        ]);
        assert.equal(
          await page.locator('[data-knowledge="aden"] .trend').count(),
          0,
        );
        assert.equal(
          await page
            .locator('[data-knowledge="aden"] .observation-age')
            .innerText(),
          "",
        );
      }
      await page.locator(".toast").waitFor({ state: "hidden" });
      await page.evaluate(() => scrollTo(0, 0));
      if (width === 390 || width === 1440 || path === "map")
        await page.screenshot({ path: `${outputDir}/${width}-${path}.png` });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(badResponses, []);
    results.push({
      width,
      height,
      status: "PASS",
      checks:
        "6 pages, images decoded, real Vue controls/assets, buy2 and synchronized Cargo, v2 knowledge and exact observation history, no overflow/pageerror/failed assets",
      errors,
      badResponses,
    });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    `${outputDir}/art-results.json`,
    JSON.stringify({ baseUrl, results }, null, 2) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
