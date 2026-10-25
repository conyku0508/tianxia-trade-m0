import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.BASE_URL ?? "http://127.0.0.1:5174/",
  out = process.env.ARTIFACT_DIR ?? "artifacts/compact-ports";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  }),
  results = [];
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
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "?release=ports-v2-20261026#/map", {
      waitUntil: "networkidle",
    });
    await page.locator(".map-painting").evaluate((i) => i.decode());
    assert.equal(await page.locator(".city-marker").count(), 20);
    const current = page.getByRole("button", { name: "選擇泉州", exact: true });
    const measurements = [];
    for (const zoom of [1, 0.75, 1.75]) {
      const factor = await page
        .locator(".map-world")
        .evaluate((e) => Number(e.style.transform.match(/scale\((.*?)\)/)[1]));
      const direction = zoom > factor ? "放大地圖" : "縮小地圖";
      for (let i = 0; i < Math.round(Math.abs(zoom - factor) / 0.25); i++)
        await page.getByRole("button", { name: direction }).click();
      const rect = await current.boundingBox();
      if (width < 768) {
        assert.ok(Math.abs(rect.width - 44) < 0.2);
        assert.ok(Math.abs(rect.height - 44) < 0.2);
        const label = await current.locator(".city-label").boundingBox();
        assert.ok(label.height <= 22);
        assert.ok(label.width < 45);
      }
      await current.click();
      assert.equal(
        await page.getByRole("dialog", { name: "泉州", exact: true }).count(),
        1,
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      measurements.push({
        zoom,
        touchWidth: rect.width,
        touchHeight: rect.height,
      });
    }
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "縮小地圖" }).click();
    await page.locator(".map-scroll").evaluate((e) => {
      e.scrollLeft = 510;
      e.scrollTop = 60;
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${width}-map.png` });
    for (const name of ["琉球", "加爾各答區域港"]) {
      await page
        .getByRole("button", { name: "選擇" + name, exact: true })
        .click();
      assert.equal(
        await page.getByRole("dialog", { name, exact: true }).count(),
        1,
      );
      await page.getByRole("button", { name: "關閉", exact: true }).click();
    }
    await current.click();
    await page.getByRole("button", { name: "進入市場", exact: true }).click();
    assert.equal(await page.locator('[data-testid^="good-"]').count(), 30);
    assert.match(await page.getByTestId("money").innerText(), /5,000/);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    results.push({
      width,
      height,
      status: "PASS",
      measurements,
      checks:
        "20 ports; current/foreign/long-label click; 0.75/1/1.75 zoom; Sheet/Escape/focus; market30; money5000; no overflow/pageerror",
    });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify({ base, results }, null, 2) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
