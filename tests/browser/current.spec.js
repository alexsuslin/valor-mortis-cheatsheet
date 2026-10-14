import { expect, test } from "@playwright/test";

test("Current can jump directly to a chapter", async ({ page }) => {
  await page.goto(".");
  await page.locator('[data-view="current"]').click();
  await page.locator("#current-chapter").selectOption("chapter-08");
  await expect(page.locator("#current-step")).toHaveValue(
    "vm-university-flask",
  );
});

test("Current shares route progress and keeps its selection after checking", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator("#route-vm-saber button").click();
  await expect(page.locator("#current")).toBeVisible();
  await page.locator('#current [data-progress-id="vm-saber"]').check();
  await expect(page.locator("#current-step")).toHaveValue("vm-saber");
  await page.locator("#current-next").click();
  await expect(page.locator("#current-step")).toHaveValue("vm-fire");
  await page.reload();
  await expect(page.locator("#current-step")).toHaveValue("vm-fire");
  await page.locator('[data-view="walkthrough"]').click();
  await expect(
    page.locator('#walkthrough [data-progress-id="vm-saber"]'),
  ).toBeChecked();
});
