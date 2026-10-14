import { expect, test } from "@playwright/test";

async function controllableStorage(page) {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites) throw Error("Blocked");
      return original.call(this, key, value);
    };
  });
}
test("pending acquisition survives storage recovery", async ({ page }) => {
  await controllableStorage(page);
  await page.goto(".");
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await expect(page.locator("#save-status")).toContainText("unavailable");
  await page.evaluate(() => {
    window.failWrites = false;
  });
  await page.locator("#theme-toggle").click();
  await page.reload();
  await page.locator('[data-view="build"]').click();
  await expect(
    page.locator('#build [data-progress-id="build-saber-obtained"]'),
  ).toBeChecked();
});
test("failed import writes retain replacement rather than resurrecting old checks", async ({
  page,
}) => {
  await controllableStorage(page);
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "save.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "valor-mortis-cheatsheet",
          version: 1,
          completed: ["vm-fire"],
          language: "en",
          theme: "dark",
          activeView: "walkthrough",
        }),
      ),
    });
  await page.locator("#apply-import").click();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).not.toBeChecked();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-fire"]'),
  ).toBeChecked();
  await page.evaluate(() => {
    window.failWrites = false;
  });
  await page.locator("#theme-toggle").click();
  await page.reload();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).not.toBeChecked();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-fire"]'),
  ).toBeChecked();
});
