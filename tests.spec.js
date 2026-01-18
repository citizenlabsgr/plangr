import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:8080";

test.describe("URL Fragment Permutations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the page to load and initialize
    await page.waitForSelector("#preferencesSection");
  });

  test("should parse single mode", async ({ page }) => {
    await page.goto(`${BASE_URL}#modes=drive`);
    await page.waitForTimeout(500); // Wait for fragment parsing
    expect(await page.evaluate(() => window.state.modes)).toEqual(["drive"]);
  });

  test("should parse multiple modes", async ({ page }) => {
    await page.goto(`${BASE_URL}#modes=drive,transit`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.modes)).toEqual([
      "drive",
      "transit",
    ]);
  });

  test("should parse all valid modes", async ({ page }) => {
    await page.goto(
      `${BASE_URL}#modes=drive,rideshare,transit,micromobility,shuttle,bike`,
    );
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.modes)).toEqual([
      "drive",
      "rideshare",
      "transit",
      "micromobility",
      "shuttle",
      "bike",
    ]);
  });

  test("should ignore invalid modes", async ({ page }) => {
    await page.goto(`${BASE_URL}#modes=drive,invalid,transit`);
    await page.waitForTimeout(500);
    const modes = await page.evaluate(() => window.state.modes);
    expect(modes).toContain("drive");
    expect(modes).toContain("transit");
    expect(modes).not.toContain("invalid");
  });

  test("should parse time in 3-digit format (HMM)", async ({ page }) => {
    await page.goto(`${BASE_URL}#time=830`); // 8:30 PM
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.time)).toBe("20:30");
    expect(await page.locator("#timeSelect")).toHaveValue("20:30");
  });

  test("should parse time in 4-digit format (HHMM)", async ({ page }) => {
    await page.goto(`${BASE_URL}#time=1000`); // 10:00 PM
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.time)).toBe("22:00");
    expect(await page.locator("#timeSelect")).toHaveValue("22:00");
  });

  test("should parse time 8:30 PM (830)", async ({ page }) => {
    await page.goto(`${BASE_URL}#time=830`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.time)).toBe("20:30");
  });

  test("should parse day parameter", async ({ page }) => {
    await page.goto(`${BASE_URL}#day=tomorrow`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.day)).toBe("tomorrow");
    expect(await page.locator("#daySelect")).toHaveValue("tomorrow");
  });

  test("should parse people parameter", async ({ page }) => {
    await page.goto(`${BASE_URL}#people=3`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.people)).toBe(3);
    expect(await page.locator("#peopleCount")).toHaveText("3");
  });

  test("should parse people within valid range (1-6)", async ({ page }) => {
    await page.goto(`${BASE_URL}#people=4`);
    await page.waitForTimeout(500);
    const people = await page.evaluate(() => window.state.people);
    expect(people).toBeGreaterThanOrEqual(1);
    expect(people).toBeLessThanOrEqual(6);
  });

  test("should ignore people outside valid range", async ({ page }) => {
    await page.goto(`${BASE_URL}#people=10`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.people)).toBe(6); // Clamped to max
  });

  test("should parse combined parameters", async ({ page }) => {
    await page.goto(
      `${BASE_URL}#modes=bike,shuttle&day=friday&time=1730&people=2`,
    );
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.modes)).toEqual([
      "bike",
      "shuttle",
    ]);
    expect(await page.evaluate(() => window.state.day)).toBe("friday");
    expect(await page.evaluate(() => window.state.time)).toBe("17:30");
    expect(await page.evaluate(() => window.state.people)).toBe(2);
  });

  test("should handle empty modes parameter", async ({ page }) => {
    await page.goto(`${BASE_URL}#modes=`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.modes)).toEqual([]);
  });

  test("should handle URL-encoded parameters", async ({ page }) => {
    await page.goto(`${BASE_URL}#day=next%20week&time=1900`);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.state.day)).toBe("next week");
    expect(await page.evaluate(() => window.state.time)).toBe("19:00");
  });

  test("should update fragment when mode is selected", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // Set required fields first (destination is already set, need day and time)
    await page.locator("#daySelect").selectOption({ value: "today" });
    await page.locator("#timeSelect").selectOption({ value: "17:00" });
    await page.waitForTimeout(300);

    const driveButton = page.locator('[data-mode="drive"]');
    await driveButton.click();
    await page.waitForTimeout(300);

    const url = page.url();
    expect(url).toContain("#modes=drive");
  });

  test("should update fragment when time is selected", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    const timeSelect = page.locator("#timeSelect");
    await timeSelect.selectOption({ value: "17:00" });
    await page.waitForTimeout(300);

    const url = page.url();
    expect(url).toContain("#time=500"); // 5:00 PM in URL format
  });

  test("should update fragment with multiple modes", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // Set required fields first (destination is already set, need day and time)
    await page.locator("#daySelect").selectOption({ value: "today" });
    await page.locator("#timeSelect").selectOption({ value: "17:00" });
    await page.waitForTimeout(300);

    await page.locator('[data-mode="drive"]').click();
    await page.locator('[data-mode="transit"]').click();
    await page.waitForTimeout(300);

    const url = page.url();
    expect(url).toContain("#modes=drive,transit");
  });

  test("should handle time conversion edge cases", async ({ page }) => {
    // Test 5:00 PM (500)
    await page.goto(`${BASE_URL}#time=500`);
    await page.waitForTimeout(500);
    await expect(page.locator("#timeSelect")).toHaveValue("17:00");

    // Test 9:30 PM (930)
    await page.goto(`${BASE_URL}#time=930`);
    await page.waitForTimeout(500);
    await expect(page.locator("#timeSelect")).toHaveValue("21:30");

    // Test 10:00 PM (1000)
    await page.goto(`${BASE_URL}#time=1000`);
    await page.waitForTimeout(500);
    await expect(page.locator("#timeSelect")).toHaveValue("22:00");
  });
});
