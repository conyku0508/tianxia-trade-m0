import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.BASE_URL ?? "http://127.0.0.1:5174/",
  out = process.env.ARTIFACT_DIR ?? "artifacts/v1-voyage/save";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  }),
  results = [];
async function buy(page) {
  await page.goto(base + "?release=m1-voyage-20261026#/market", {
    waitUntil: "networkidle",
  });
  await page
    .getByTestId("good-tea")
    .getByRole("button", { name: "買入", exact: true })
    .click();
  await page.getByRole("button", { name: "確認摘要", exact: true }).click();
  await page.getByRole("button", { name: "確認買入", exact: true }).click();
}
try {
  const blocked = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
  });
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  const page = await blocked.newPage();
  await buy(page);
  await expect(page.getByTestId("money")).toHaveText("4,622 文");
  await expect(page.locator(".save-warning")).toContainText("本機存檔失敗");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "選單" })
    .click();
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出備份", exact: true }).click();
  assert.equal(
    JSON.parse(await fs.readFile(await (await d).path(), "utf8")).player.money,
    4622,
  );
  results.push({
    case: "quota failure preserves live state and allows complete export",
    status: "PASS",
  });
  await blocked.close();
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    one = await context.newPage();
  await buy(one);
  const two = await context.newPage();
  await two.goto(base + "?release=m1-voyage-20261026#/market", {
    waitUntil: "networkidle",
  });
  await buy(one);
  const latest = await one.evaluate(() =>
    localStorage.getItem("tianxia-v1-save"),
  );
  await two
    .getByTestId("good-tea")
    .getByRole("button", { name: "買入", exact: true })
    .click();
  await two.getByRole("button", { name: "確認摘要", exact: true }).click();
  await two.getByRole("button", { name: "確認買入", exact: true }).click();
  await expect(two.locator(".save-warning")).toContainText("另一個分頁");
  assert.equal(
    await one.evaluate(() => localStorage.getItem("tianxia-v1-save")),
    latest,
  );
  results.push({
    case: "second tab detects newer save and does not overwrite it",
    status: "PASS",
  });
  await two.close();
  await one.evaluate(() => localStorage.setItem("tianxia-v1-save", "{broken"));
  await one.reload({ waitUntil: "networkidle" });
  await expect(one.getByTestId("money")).toHaveText("4,622 文");
  await one.getByRole("navigation").getByRole("link", { name: "選單" }).click();
  await expect(
    one.getByText("主存檔無法使用，已從上次備份恢復", { exact: true }),
  ).toBeVisible();
  results.push({
    case: "corrupt primary recovers last-good backup at actual browser origin",
    status: "PASS",
  });
  await context.close();
} finally {
  await browser.close();
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify({ base, results }, null, 2) + "\n",
  );
}
console.log(results);
