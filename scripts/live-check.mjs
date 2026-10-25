import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const url = "https://conyku0508.github.io/tianxia-trade-m0/";
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
    const response = await page.goto(url + "?release=m0-20261026", {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    await page.getByRole("button", { name: "選擇泉州", exact: true }).click();
    const sheet = await page.getByRole("dialog").boundingBox();
    if (width < 768) {
      assert.ok(sheet.width >= width - 2);
      assert.ok(sheet.y > 0);
    } else {
      assert.ok(sheet.width <= 420);
    }
    await page.getByRole("button", { name: "進入市場", exact: true }).click();
    const gridColumns = await page
      .locator(".goods-list")
      .evaluate(
        (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
      );
    assert.equal(gridColumns, width < 768 ? 1 : 2);
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByLabel("交易數量", { exact: true }).fill("2");
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.getByRole("button", { name: "確認買入", exact: true }).click();
    assert.match(await page.getByTestId("money").innerText(), /4,244/);
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "貨艙", exact: false })
      .click();
    for (const value of ["756", "720", "-36"])
      assert.ok((await page.locator("main").innerText()).includes(value));
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "情報", exact: false })
      .click();
    for (const value of ["2天前", "3天前", "尚無情報"])
      assert.ok((await page.locator("main").innerText()).includes(value));
    await page
      .getByRole("button", { name: "查看航線", exact: true })
      .nth(1)
      .click();
    await page.getByRole("button", { name: "準備前往", exact: true }).click();
    assert.ok(
      (await page.locator("main").innerText()).includes("已準備：泉州 → 琉球"),
    );
    assert.match(await page.getByTestId("money").innerText(), /4,244/);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(badResponses, []);
    await page.screenshot({
      path: `artifacts/live-${width}-prepared.png`,
      fullPage: true,
    });
    await page.reload({ waitUntil: "networkidle" });
    assert.match(await page.getByTestId("money").innerText(), /5,000/);
    results.push({
      width,
      height,
      status: "PASS",
      http: response.status(),
      gridColumns,
      flow: "Map→City→Market→Buy2Tea→Cargo→Intelligence→Route→Prepared; money4244; reload5000",
      errors,
      badResponses,
    });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/live-results.json",
    JSON.stringify({ url, results }, null, 2) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
