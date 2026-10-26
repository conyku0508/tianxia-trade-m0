import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.BASE_URL ?? "http://127.0.0.1:5174/",
  out = process.env.ARTIFACT_DIR ?? "artifacts/v1-voyage";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  }),
  results = [];
const money = async (page, value) =>
  expect(page.getByTestId("money")).toHaveText(
    value.toLocaleString("en-US") + " 文",
  );
async function nav(page, name) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name, exact: false })
    .click();
}
async function trade(page, id, mode, quantity) {
  await page
    .getByTestId("good-" + id)
    .getByRole("button", { name: mode, exact: true })
    .click();
  await page.getByLabel("交易數量", { exact: true }).fill(String(quantity));
  await page.getByRole("button", { name: "確認摘要", exact: true }).click();
  await page.getByRole("button", { name: "確認" + mode, exact: true }).click();
}
async function prepare(page, destination) {
  await nav(page, "選單");
  await page.getByRole("button", { name: "航線規劃", exact: true }).click();
  await page.locator(".route-card").filter({ hasText: destination }).click();
  await page.getByRole("button", { name: "準備前往", exact: true }).click();
}
async function depart(page) {
  await page.getByRole("button", { name: "確認出航", exact: true }).click();
  await page
    .getByRole("button", { name: "支付旅費並出航", exact: true })
    .dblclick({ delay: 30 })
    .catch(() => {});
  await expect(
    page.getByRole("heading", { name: "海上航行", exact: true }),
  ).toBeVisible();
}
async function advance(page) {
  await page.getByRole("button", { name: "航行一天", exact: true }).click();
}
async function shoot(page, name) {
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
    scrollTo(0, 0);
  });
  await page.locator(".toast").waitFor({ state: "hidden" });
  await page.screenshot({ path: `${out}/${name}.png` });
}
try {
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    const context = await browser.newContext({
        viewport: { width, height },
        acceptDownloads: true,
      }),
      page = await context.newPage(),
      errors = [],
      bad = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) bad.push({ url: r.url(), status: r.status() });
    });
    await page.goto(base + "?release=m1-voyage-20261026#/map", {
      waitUntil: "networkidle",
    });
    await money(page, 5000);
    await nav(page, "市場");
    await trade(page, "tea", "買入", 10);
    await money(page, 1220);
    await prepare(page, "琉球");
    await money(page, 1220);
    await page.getByRole("button", { name: "確認出航", exact: true }).click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await money(page, 1220);
    await depart(page);
    await money(page, 1100);
    await page
      .getByRole("button", { name: "航行一天", exact: true })
      .dblclick({ delay: 30 });
    await expect(page.locator(".status")).toContainText("第13天");
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tianxia-v1-save")),
    );
    assert.equal(saved.voyage.active.elapsedDays, 1);
    assert.equal(saved.player.money, 1100);
    await page.reload({ waitUntil: "networkidle" });
    await money(page, 1100);
    await expect(page.locator(".status")).toContainText("第13天");
    await expect(
      page.getByRole("heading", { name: "海上航行", exact: true }),
    ).toBeVisible();
    if (width === 390 || width === 1440) await shoot(page, `${width}-sailing`);
    await nav(page, "地圖");
    assert.equal(await page.locator(".moving-ship").count(), 1);
    await nav(page, "市場");
    await expect(
      page.getByRole("heading", { name: "航行中無法交易", exact: true }),
    ).toBeVisible();
    assert.equal(await page.locator('[data-testid^="good-"]').count(), 0);
    await page.getByRole("button", { name: "繼續航行", exact: true }).click();
    await advance(page);
    await expect(page.locator(".status")).toContainText("第14天");
    await advance(page);
    await expect(
      page.getByRole("heading", { name: "已抵達琉球", exact: true }),
    ).toBeVisible();
    await money(page, 1100);
    await expect(page.locator(".status")).toContainText("琉球 · 第15天");
    if (width === 390 || width === 1440) await shoot(page, `${width}-arrival`);
    await nav(page, "情報");
    await expect(
      page.locator('[data-knowledge="ryukyu"][data-good="tea"]'),
    ).toContainText("480 文");
    await expect(
      page.locator('[data-knowledge="ryukyu"][data-good="tea"]'),
    ).toContainText("第15天觀察");
    assert.equal(
      await page.locator('[data-knowledge="aden"] .trend').count(),
      0,
    );
    await nav(page, "市場");
    assert.equal(await page.locator('[data-testid^="good-"]').count(), 30);
    await expect(page.locator("h1")).toContainText("琉球市場");
    await trade(page, "tea", "賣出", 10);
    await money(page, 5660);
    await trade(page, "timber", "買入", 10);
    await money(page, 4925);
    await prepare(page, "泉州");
    await depart(page);
    await money(page, 4805);
    for (let i = 0; i < 3; i++) await advance(page);
    await expect(page.locator(".status")).toContainText("泉州 · 第18天");
    await nav(page, "市場");
    await trade(page, "timber", "賣出", 10);
    await money(page, 5945);
    await nav(page, "貨艙");
    await expect(
      page.getByRole("heading", { name: "貨艙尚無貨物", exact: true }),
    ).toBeVisible();
    await nav(page, "選單");
    await expect(page.locator(".statement-list")).toContainText("945");
    if (width === 390 || width === 1440) await shoot(page, `${width}-ledger`);
    const downloadWait = page.waitForEvent("download");
    await page.getByRole("button", { name: "匯出備份", exact: true }).click();
    const download = await downloadWait,
      backup = await fs.readFile(await download.path(), "utf8");
    const parsed = JSON.parse(backup);
    assert.equal(parsed.player.money, 5945);
    assert.equal(parsed.game.currentDay, 18);
    await page.getByLabel("備份JSON文字", { exact: true }).fill("{bad");
    await page.getByRole("button", { name: "檢查並匯入", exact: true }).click();
    await expect(
      page.getByText("備份格式或數值不一致，未更動目前進度", { exact: true }),
    ).toBeVisible();
    await money(page, 5945);
    await page
      .getByRole("button", { name: "重設原型資料", exact: true })
      .click();
    await page.getByRole("button", { name: "確認重設", exact: true }).click();
    await money(page, 5000);
    await page
      .getByLabel("匯入備份檔", { exact: true })
      .setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(backup),
      });
    await expect(
      page.getByRole("dialog", { name: "以備份取代目前進度？" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await money(page, 5000);
    await page.getByLabel("備份JSON文字", { exact: true }).fill(backup);
    await page.getByRole("button", { name: "檢查並匯入", exact: true }).click();
    await page.getByRole("button", { name: "確認還原", exact: true }).click();
    await money(page, 5945);
    await page.reload({ waitUntil: "networkidle" });
    await money(page, 5945);
    await expect(page.locator(".status")).toContainText("第18天");
    await page.getByRole("button", { name: "測試說明", exact: true }).click();
    await expect(page.locator("h1")).toContainText("怎麼測試");
    await expect(page.locator("main")).toContainText("5,945");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await nav(page, "選單");
    await page
      .getByRole("button", { name: "重設原型資料", exact: true })
      .click();
    await page.getByRole("button", { name: "確認重設", exact: true }).click();
    await nav(page, "市場");
    await page
      .getByTestId("good-tea")
      .getByRole("button", { name: "買入", exact: true })
      .click();
    await page.getByRole("button", { name: "MAX", exact: true }).click();
    await page.getByRole("button", { name: "確認摘要", exact: true }).click();
    await page.getByRole("button", { name: "確認買入", exact: true }).click();
    await money(page, 86);
    await nav(page, "選單");
    await page.getByRole("button", { name: "航線規劃", exact: true }).click();
    await page.locator(".route-card").filter({ hasText: "琉球" }).click();
    await expect(
      page.getByRole("button", { name: "準備前往", exact: true }),
    ).toBeDisabled();
    await money(page, 86);
    assert.deepEqual(errors, []);
    assert.deepEqual(bad, []);
    results.push({
      width,
      height,
      status: "PASS",
      roundtrip: { city: "quanzhou", day: 18, cash: 5945, netProfit: 945 },
      checks:
        "cancel/duplicate departure, duplicate turn, blocked sea trade, mid-voyage reload, live knowledge, two-port30-goods, export/import/cancel/corrupt/reset, fare shortage, test guide",
      errors,
      bad,
    });
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify({ base, results }, null, 2) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
