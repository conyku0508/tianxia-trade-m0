import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5174/";
const outputDir = process.env.ARTIFACT_DIR ?? "artifacts";
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
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(baseUrl);
    await page.getByRole("button", { name: "選擇泉州", exact: true }).click();
    await page.getByRole("button", { name: "進入市場", exact: true }).click();
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByLabel("交易數量", { exact: true }).fill("2");
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    assert.match(await page.getByTestId("money").innerText(), /5,000/);
    assert.equal(
      await page.getByRole("dialog", { name: "買入 普通茶葉" }).count(),
      1,
    );
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page
      .getByRole("button", { name: "確認買入", exact: true })
      .dblclick({ delay: 30 })
      .catch(() => {});
    await page.getByTestId("money").filter({ hasText: "4,244" }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "貨艙", exact: false })
      .click();
    assert.match(await page.locator("main").innerText(), /756/);
    assert.match(await page.locator("main").innerText(), /720/);
    assert.match(await page.locator("main").innerText(), /-36/);
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "情報", exact: false })
      .click();
    for (const s of ["2天前", "3天前", "尚無情報"])
      assert.match(await page.locator("main").innerText(), new RegExp(s));
    await page
      .getByRole("button", { name: "查看航線", exact: true })
      .nth(1)
      .click();
    await page.getByRole("button", { name: "準備前往", exact: true }).click();
    assert.match(await page.locator("main").innerText(), /已準備：泉州 → 琉球/);
    assert.match(await page.getByTestId("money").innerText(), /4,244/);
    await page.getByRole("button", { name: "取消準備", exact: true }).click();
    assert.equal(await page.getByText("已準備：泉州 → 琉球").count(), 0);
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "市場", exact: false })
      .click();
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "賣出", exact: true })
      .click();
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.getByRole("button", { name: "確認賣出", exact: true }).click();
    assert.match(await page.getByTestId("money").innerText(), /4,586/);
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByLabel("交易數量", { exact: true }).fill("0");
    assert.match(await page.getByRole("alert").innerText(), /正整數/);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    const focus = await page.evaluate(
      () => document.activeElement?.textContent,
    );
    assert.match(focus, /買入/);
    for (const path of [
      "map",
      "market",
      "cargo",
      "intelligence",
      "route",
      "menu",
    ]) {
      await page.goto(baseUrl + "#/" + path);
      await page.locator("h1").waitFor();
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        bottom: document.querySelector("nav").getBoundingClientRect().bottom,
        viewport: innerHeight,
      }));
      assert.equal(layout.overflow, false, `${width} ${path} overflow`);
      assert.ok(layout.bottom <= layout.viewport + 1);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `${outputDir}/${width}-${path}.png`,
          fullPage: true,
        });
    }
    await page
      .getByRole("button", { name: "重設原型資料", exact: true })
      .click();
    await page.getByRole("button", { name: "確認重設", exact: true }).click();
    assert.match(await page.getByTestId("money").innerText(), /5,000/);
    await page.goto(baseUrl + "#/market");
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByRole("button", { name: "MAX", exact: true }).click();
    assert.equal(
      await page.getByLabel("交易數量", { exact: true }).inputValue(),
      "13",
    );
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.getByRole("button", { name: "確認買入", exact: true }).click();
    assert.match(await page.getByTestId("money").innerText(), /86/);
    await page.reload();
    assert.match(await page.getByTestId("money").innerText(), /86/);
    assert.deepEqual(errors, []);
    results.push({
      width,
      height,
      status: "PASS",
      flow: "Map→City→Market, cancel/buy/sell/MAX, Cargo/knowledge, prepare/cancel, reset/reload, six pages overflow/navigation, Escape/focus",
    });
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    outputDir + "/browser-results.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(JSON.stringify(results, null, 2));
