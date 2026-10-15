import { expect, test } from "@playwright/test";

test("Current can jump directly to a chapter", async ({ page }) => {
  await page.goto(".");
  await page.locator('[data-view="current"]').click();
  await page.locator("#current-jump > summary").click();
  await page.locator("#current-chapter").focus();
  await page.locator("#current-chapter").selectOption("chapter-08");
  await expect(page.locator("#current-chapter")).toBeFocused();
  await expect(page.locator("#current-step")).toBeVisible();
  await expect(page.locator("#current-step")).toHaveValue(
    "vm-university-flask",
  );
  await page.locator("#current-step").selectOption("vm-shield");
  await expect(page.locator(".current-card .warning")).toBeVisible();
});

test("mobile Current keeps both navigation buttons reachable and preserves checks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(".#current");
  const previous = page.locator("#current-previous");
  const next = page.locator("#current-next");
  await expect(previous).toBeDisabled();
  await expect(next).toBeInViewport();
  await next.click();
  await expect(page.locator("#current-step")).toHaveValue("vm-fire");
  await page.locator('#current [data-progress-id="vm-fire"]').check();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(previous).toBeInViewport();
  await previous.click();
  await expect(page.locator("#current-step")).toHaveValue("vm-saber");
  await expect(page.locator(".current-card")).toBeInViewport();
  await next.click();
  await expect(
    page.locator('#current [data-progress-id="vm-fire"]'),
  ).toBeChecked();
  await page.reload();
  await expect(page.locator("#current-step")).toHaveValue("vm-fire");
  await expect(page.locator("#current-jump")).not.toHaveAttribute("open", "");
  await expect(page.locator("#current-build")).not.toHaveAttribute("open", "");
  await expect(page.locator("#current")).not.toContainText("General reminders");
  await page.locator("#current-jump > summary").click();
  await page.locator("#current-chapter").selectOption("chapter-11");
  await page.locator("#current-step").selectOption("vm-oathbound-blade");
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
});

test("mobile views remain distinct and fit a narrow screen in both languages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(".");
  for (const language of ["en", "ru"]) {
    await page.locator(`[data-language="${language}"]`).click();
    for (const view of [
      "current",
      "walkthrough",
      "achievements",
      "build",
      "tips",
      "current",
    ]) {
      await page.locator(`[data-view="${view}"]`).click();
      await expect(page.locator(`#${view}`)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.locator("#theme-toggle").click();
  }
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
