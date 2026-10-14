import { expect, test } from "@playwright/test";

test("ordinary quest achievements do not claim quest failure", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('[data-view="achievements"]').click();
  await page.locator("#achievement-category").selectOption("quest");
  await expect(page.locator("#achievement-category option:checked")).toHaveText(
    "Quests",
  );
  await expect(page.locator("#achievement-cards .eyebrow").first()).toHaveText(
    "Quests",
  );
});

test("achievement filters combine category and completed state", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('[data-view="achievements"]').click();
  await page.locator("#achievement-category").selectOption("completion");
  await page
    .locator('#achievements input[data-progress-id="achievement-all"]')
    .check();
  await page.locator("#achievement-hide").check();
  await expect(page.locator("#achievement-cards article")).toHaveCount(0);
});

test("achievement progress is independent and related links clear route filters", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('[data-progress-id="vm-saber"]').check();
  await page.locator("#search").fill("no results");
  await page.locator('[data-view="achievements"]').click();
  await expect(page.locator("#achievement-count")).toContainText("0 / 39");
  await page.locator("#achievement-search").fill("Arsenal");
  await page.locator("#achievements input[data-progress-id]").check();
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
