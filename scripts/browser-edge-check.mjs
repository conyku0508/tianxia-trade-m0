import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
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
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto("http://127.0.0.1:5174/#/map");
    await page.getByRole("button", { name: "放大地圖" }).click();
    assert.match(
      await page.locator(".map-world").getAttribute("style"),
      /1.25/,
    );
    await page.getByRole("button", { name: "縮小地圖" }).click();
    await page.getByRole("button", { name: "放大地圖" }).click();
    await page.getByRole("button", { name: "放大地圖" }).click();
    const scroll = page.locator(".map-scroll");
    await scroll.evaluate((e) => (e.scrollLeft = 100));
    const rect = await scroll.boundingBox();
    const before = await scroll.evaluate((e) => e.scrollLeft);
    await page.mouse.move(rect.x + 70, rect.y + 100);
    await page.mouse.down();
    await page.mouse.move(rect.x + 10, rect.y + 80, { steps: 5 });
    await page.mouse.up();
    const after = await scroll.evaluate((e) => e.scrollLeft);
    assert.notEqual(before, after, "map drag scrolls");
    await page.getByRole("button", { name: "選擇泉州", exact: true }).click();
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "進入市場",
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute("aria-label"),
      ),
      "關閉",
    );
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "市場", exact: false })
      .click();
    await page
      .getByTestId("good-fur")
      .getByRole("button", { name: "買入", exact: true })
      .scrollIntoViewIfNeeded();
    const last = await page
        .getByTestId("good-fur")
        .getByRole("button", { name: "買入", exact: true })
        .boundingBox(),
      nav = await page.locator("nav").boundingBox();
    assert.ok(
      last.y + last.height < nav.y,
      "last CTA scrolls clear of navigation",
    );
    await page
      .getByTestId("good-fur")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByLabel("交易數量", { exact: true }).focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("2");
    assert.equal(
      await page.getByLabel("交易數量", { exact: true }).inputValue(),
      "2",
    );
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "確認買入",
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 1);
    await page.keyboard.press("Escape");
    // Layout-only stress; DOM text substitutions never mutate application state.
    await page
      .getByTestId("money")
      .evaluate((e) => (e.textContent = "999,999,999 文"));
    await page
      .getByTestId("good-rice")
      .locator("h3")
      .evaluate((e) => (e.textContent = "特長商品名稱測試測試測試測試"));
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: `artifacts/${width}-viewport.png` });
    results.push({
      width,
      height,
      status: "PASS",
      checks:
        "map zoom/drag, last CTA, numeric keyboard, Sheet/Modal focus trap and Escape, layout-only long text/large money",
    });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/browser-edge-results.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(results);
