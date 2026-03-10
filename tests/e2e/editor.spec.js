const { test, expect } = require("@playwright/test");

test("editor shell loads and primary controls are visible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "MkDocs Editor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nav speichern" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Speichern" })).toBeVisible();
  await expect(page.locator("#editor")).toBeVisible();
  await expect(page.locator("#preview-frame")).toBeVisible();
});
