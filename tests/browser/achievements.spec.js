import { expect, test } from "@playwright/test";

test("achievement progress is independent and related links clear route filters", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('[data-progress-id="vm-saber"]').check();
  await page.locator("#search").fill("no results");
  await page.locator('[data-view="achievements"]').click();
  await expect(page.locator("#achievement-count")).toContainText("0 / 39");
  await page.locator("#achievement-search").fill("Arsenal");
  await page.locator("#achievements input[type=checkbox]").check();
  await expect(page.locator("#achievement-count")).toContainText("1 / 39");
  await page
    .locator("#achievements details")
    .first()
    .locator("summary")
    .click();
  await page.locator('#achievements [data-route-id="vm-saber"]').click();
  await expect(page.locator("#search")).toHaveValue("");
  await expect(page.locator('[data-progress-id="vm-saber"]')).toBeChecked();
});
