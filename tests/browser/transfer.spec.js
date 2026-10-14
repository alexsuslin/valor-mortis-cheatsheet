import { expect, test } from "@playwright/test";

test("link preview requires consent, cancellation preserves checks, application restores snapshot", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.locator("#share-save").click();
  const link = await page.locator("#transfer-link").inputValue();
  await page.locator(".dialog-close").click();
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').uncheck();
  await page.goto(link);
  await expect(page.locator("#save-dialog")).toBeVisible();
  await page.locator("#cancel-import").click();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).not.toBeChecked();
  await page.goto(link);
  await page.locator("#apply-import").click();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
  expect(page.url()).not.toContain("vm-progress=");
});
test("foreign JSON and damaged links do not replace the current save", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "foreign.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "hellisus-cheatsheet",
          version: 1,
          completed: [],
        }),
      ),
    });
  await expect(page.locator("#toast")).toContainText("unchanged");
  await page.goto("./#vm-progress=1.0000.bad");
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
});
