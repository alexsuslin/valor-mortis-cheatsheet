import { expect, test } from "@playwright/test";

test("acquisition follows route; equipment and application stay manual", async ({
  page,
}) => {
  await page.goto(".");
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').check();
  await page.locator('[data-view="build"]').click();
  await expect(
    page.locator('#build [data-progress-id="build-saber-obtained"]'),
  ).toBeChecked();
  await expect(
    page.locator('#build [data-progress-id="build-saber-applied"]'),
  ).not.toBeChecked();
  await page.locator('#build [data-progress-id="equipment-saber"]').check();
  await page.locator('[data-view="walkthrough"]').click();
  await page.locator('#walkthrough [data-progress-id="vm-saber"]').uncheck();
  await page.locator('[data-view="build"]').click();
  await expect(
    page.locator('#build [data-progress-id="build-saber-obtained"]'),
  ).toBeChecked();
  await expect(
    page.locator('#build [data-progress-id="equipment-saber"]'),
  ).toBeChecked();
});
