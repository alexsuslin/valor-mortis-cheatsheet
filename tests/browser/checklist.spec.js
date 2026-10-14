import { expect, test } from "@playwright/test";

test("route checks survive reload, language and theme changes", async ({
  page,
}) => {
  await page.goto(".");
  await expect(page.locator("#progress-count")).toContainText("152");
  await page.locator('[data-progress-id="vm-saber"]').check();
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await page.locator("#theme-toggle").click();
  await page.reload();
  await expect(page.locator('[data-progress-id="vm-saber"]')).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});
test("chapter navigation and bilingual search find later content", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator("#chapter-filter").selectOption("chapter-11");
  await expect(page.locator("#checklist-sections")).toContainText("The Entity");
  await page.locator("#chapter-filter").selectOption("all");
  await page.locator("#search").fill("Щит");
  await expect(page.locator("#checklist-sections")).toContainText("Shield");
});
test("coverage notes have no checkboxes", async ({ page }) => {
  await page.goto(".");
  await page.locator("#about-toggle").click();
  await expect(page.locator("[data-coverage-note]")).toHaveCount(6);
  await expect(page.locator("[data-coverage-note] input")).toHaveCount(0);
});
test("mobile layout fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(".");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
