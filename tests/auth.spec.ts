import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto("/");
    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("Login Flow (valid credentials)", async ({ page }) => {
    // Confirm we start on the login page
    await expect(page.locator("#login-title")).toBeVisible();

    // Fill the credentials
    await page.fill("#username-input", "admin");
    await page.fill("#password-input", "password");

    // Click submit
    await page.click("#login-submit-btn");

    // Expect to be logged in and see the logout button and dashboard header
    await expect(page.locator("#logout-btn")).toBeVisible();
    await expect(page.locator("text=Authenticated Dashboard")).toBeVisible();
  });

  test("Login Flow Error (invalid credentials)", async ({ page }) => {
    // Confirm login page
    await expect(page.locator("#login-title")).toBeVisible();

    // Fill incorrect credentials
    await page.fill("#username-input", "admin");
    await page.fill("#password-input", "wrong_password");

    // Click submit
    await page.click("#login-submit-btn");

    // Expect to see an error message
    const errorBox = page.locator("#login-error");
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText("Invalid username or password");
  });
});
