import { test, expect } from "@playwright/test";

test.describe("Kanban Board Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard & log in
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.fill("#username-input", "admin");
    await page.fill("#password-input", "password");
    await page.click("#login-submit-btn");

    // Make sure we are in
    await expect(page.locator("#logout-btn")).toBeVisible();
  });

  test("Task Lifecycle (create, move, delete)", async ({ page }) => {
    // 1. Create a task
    await page.click("#add-task-btn");
    await page.fill("#new-task-title", "Practice Playwright Assertions");
    await page.fill("#new-task-desc", "Learn locator syntax and assertion timeouts");
    await page.selectOption("#new-task-priority", "high");
    await page.click("#submit-task-btn");

    // Verify task exists in To-Do column
    const todoColumn = page.locator("#column-todo");
    await expect(todoColumn).toContainText("Practice Playwright Assertions");

    // 2. Move task to "In Progress"
    // Click the arrow key in the task card (which points to next)
    const taskCard = todoColumn.locator("text=Practice Playwright Assertions").locator("xpath=../..");
    const nextBtn = taskCard.locator('button:has([data-lucide="arrow-right"]), button:has-text("")').last(); // Get move button
    await nextBtn.click();

    // Verify task is in "In Progress"
    const progressColumn = page.locator("#column-progress");
    await expect(progressColumn).toContainText("Practice Playwright Assertions");

    // 3. Delete task
    // Hover over the card and click delete trash icon
    const progressCard = progressColumn.locator("text=Practice Playwright Assertions").locator("xpath=../..");
    await progressCard.hover();
    
    // Find the delete button with trash icon
    const deleteBtn = progressCard.locator("button").first();
    await deleteBtn.click();

    // Verify it is gone
    await expect(progressColumn).not.toContainText("Practice Playwright Assertions");
  });

  test("Filter and Search options", async ({ page }) => {
    // Search for a task that doesn't exist
    await page.fill("#search-input", "xyz-non-existent-task");
    
    // All columns should display "No tasks here" or be empty of matching tasks
    await expect(page.locator("#column-todo")).toContainText("No tasks here");
    await expect(page.locator("#column-progress")).toContainText("No tasks here");
    await expect(page.locator("#column-done")).toContainText("No tasks here");

    // Clear search
    await page.fill("#search-input", "");

    // Change priority filter to low
    await page.selectOption("#priority-filter", "low");

    // Verify high priority task is hidden (e.g. Setup Playwright Tests is high, it should not show)
    await expect(page.locator("#column-todo")).not.toContainText("Setup Playwright Tests");
  });
});
