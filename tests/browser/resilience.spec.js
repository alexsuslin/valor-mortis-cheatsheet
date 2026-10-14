import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("corrupt storage preserves checked progress and an exportable snapshot", async ({
  page,
  context,
}) => {
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  const other = await context.newPage();
  await other.goto(".");
  await expect(other.locator("#save-controls")).toBeVisible();
  await other.evaluate(() =>
    localStorage.setItem("valor-mortis-checklist-v1", "{"),
  );
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
  await expect(page.locator("#save-status")).toContainText("unavailable");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-save").click();
  const download = await downloadPromise;
  const snapshot = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(snapshot.completed).toContain("vm-saber");
  expect(snapshot.completed).toContain("build-saber-obtained");
  await page.locator("#theme-toggle").click();
  await page.reload();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
  await other.close();
});

test("unchecking a blocked route pickup retains historical acquisition after recovery", async ({
  page,
}) => {
  await controllableStorage(page);
  await page.goto(".");
  await expect(page.locator("#save-controls")).toBeVisible();
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').uncheck();
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

test("an explicit acquisition correction overrides an earlier derived pending mark", async ({
  page,
}) => {
  await controllableStorage(page);
  await page.goto(".");
  await expect(page.locator("#save-controls")).toBeVisible();
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.locator('[data-view="build"]').click();
  await page
    .locator('#build [data-progress-id="build-saber-obtained"]')
    .uncheck();
  await page.evaluate(() => {
    window.failWrites = false;
  });
  await page.locator("#theme-toggle").click();
  await page.reload();
  await expect(
    page.locator('#build [data-progress-id="build-saber-obtained"]'),
  ).not.toBeChecked();
});

test("corrupt cross-tab storage does not crash the active guide", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(".");
  const other = await context.newPage();
  await other.goto(".");
  await other.evaluate(() =>
    localStorage.setItem(
      "valor-mortis-checklist-v1",
      JSON.stringify({ completed: { bad: true } }),
    ),
  );
  await page.locator("#theme-toggle").click();
  await expect(page.locator("#progress-count")).toContainText("152");
  expect(errors).toEqual([]);
  await other.close();
});

test("visiting all views never creates duplicated control IDs", async ({
  page,
}) => {
  await page.goto(".");
  for (const view of [
    "build",
    "tips",
    "current",
    "achievements",
    "walkthrough",
  ])
    await page.locator(`[data-view="${view}"]`).click();
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((n) => n.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicates).toEqual([]);
});
test("malformed content presents retry without reporting success", async ({
  page,
}) => {
  await page.route("**/data/guide.json*", (route) =>
    route.fulfill({ body: "{" }),
  );
  await page.goto(".");
  await expect(page.locator("#load-error")).toBeVisible();
  await expect(page.locator("#progress-count")).toHaveText("—");
  await page.unroute("**/data/guide.json*");
  await page.locator("#retry").click();
  await expect(page.locator("#progress-count")).toContainText("152");
});
test("two open tabs merge independent edits", async ({ page, context }) => {
  await page.goto(".");
  const other = await context.newPage();
  await other.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await other.locator('#walkthrough [data-progress-id="vm-fire"]').check();
  await page.reload();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-fire"]'),
  ).toBeChecked();
  await other.close();
});

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
  await page.locator("#import-file").setInputFiles({
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
