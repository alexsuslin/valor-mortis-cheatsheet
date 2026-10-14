import { expect, test } from "@playwright/test";

test("newer transfers tell the recipient to update and preserve existing progress", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.goto("./#vm-progress=1.0000ffff.9f62cde3");
  await expect(page.locator("#toast")).toContainText("Update this companion");
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
});

test("clipboard failure leaves a selectable link and a rendered QR", async ({
  page,
}) => {
  await page.goto(".");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(Error("denied")) },
      configurable: true,
    });
  });
  await page.locator("#share-save").click();
  await expect(page.locator("#transfer-qr svg")).toBeVisible();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(page.locator("#save-dialog")).toContainText("Select and copy");
  await expect(page.locator("#transfer-link")).toBeFocused();
});
test("oversized QR still offers link and JSON export", async ({ page }) => {
  await page.goto(".");
  await page.evaluate(() =>
    history.replaceState(null, "", `/${"a".repeat(4000)}`),
  );
  await page.locator("#share-save").click();
  await expect(page.locator("#transfer-qr")).toContainText("too large");
  await expect(page.locator("#transfer-link")).toBeVisible();
  await expect(
    page.locator("#save-dialog").getByRole("button", { name: "Export JSON" }),
  ).toBeVisible();
});

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
  await page.locator("#import-file").setInputFiles({
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
