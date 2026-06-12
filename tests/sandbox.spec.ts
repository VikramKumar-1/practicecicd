import { test, expect } from "@playwright/test";

test.describe("Sandbox Simulated Failure & Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("Session Persistence & Logout Flow", async ({ page }) => {
    // 1. Login
    await page.fill("#username-input", "admin");
    await page.fill("#password-input", "password");
    await page.click("#login-submit-btn");
    await expect(page.locator("#logout-btn")).toBeVisible();

    // 2. Refresh page and verify we are still logged in
    await page.reload();
    await expect(page.locator("#logout-btn")).toBeVisible();

    // 3. Logout and verify we are back to login screen
    await page.click("#logout-btn");
    await expect(page.locator("#login-title")).toBeVisible();
  });

  test("Failure Simulation - Task Creation failure", async ({ page }) => {
    // 1. Log in
    await page.fill("#username-input", "admin");
    await page.fill("#password-input", "password");
    await page.click("#login-submit-btn");
    await expect(page.locator("#logout-btn")).toBeVisible();

    // 2. Enable Break Task Creation simulation
    await page.click("#toggle-break-task");

    // 3. Listen to dialog/alert
    let dialogMsg = "";
    page.on("dialog", async (dialog) => {
      dialogMsg = dialog.message();
      await dialog.dismiss();
    });

    // 4. Try adding a task
    await page.click("#add-task-btn");
    await page.fill("#new-task-title", "Failed Task Test");
    await page.fill("#new-task-desc", "This task should fail creation");
    await page.click("#submit-task-btn");

    // 5. Verify the simulated failure alert was shown
    expect(dialogMsg).toContain("Simulated Failure");
    
    // Close the modal if it's still open
    if (await page.locator("text=Cancel").isVisible()) {
      await page.click("text=Cancel");
    }

    // 6. Turn off the failure simulation
    await page.click("#toggle-break-task");

    // 7. Try adding task again
    await page.click("#add-task-btn");
    await page.fill("#new-task-title", "Successful Task Test");
    await page.fill("#new-task-desc", "This task should succeed");
    await page.click("#submit-task-btn");

    // Verify it is created successfully in To Do column
    const todoColumn = page.locator("#column-todo");
    await expect(todoColumn).toContainText("Successful Task Test");
  });
});
