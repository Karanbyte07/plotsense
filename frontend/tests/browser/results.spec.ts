import { test, expect } from "@playwright/test";
import { searchResponse } from "./fixtures";

test("results show real response fields, scores, similar search and home reset", async ({ page }) => {
  const queries: string[] = [];
  await page.route("**/api/suggest?**", route => route.fulfill({ json: [] }));
  await page.route("**/api/search", route => {
    const query = route.request().postDataJSON().query;
    queries.push(query);
    return route.fulfill({ json: searchResponse(2, query) });
  });
  await page.goto("/");
  await page.getByRole("combobox").fill("dream movies");
  await page.getByRole("combobox").press("Enter");
  await expect(page.getByRole("heading", { name: "2 results" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Inception", exact: true })).toBeVisible();
  await expect(page.getByText("of 9,500 films")).toBeVisible();
  const score = page.getByRole("button", { name: "Hybrid match score 92 percent" }).first();
  await score.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await score.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "More like this" }).first().click();
  await expect.poll(() => queries.at(-1)).toBe("like Inception");
  await expect(page.getByRole("heading", { name: "2 results" })).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: "CINEMATCH" })).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("empty results offer sample searches and returning home cancels pending responses", async ({ page }) => {
  await page.route("**/api/suggest?**", route => route.fulfill({ json: [] }));
  await page.route("**/api/search", async route => {
    const query = route.request().postDataJSON().query;
    if (query !== "empty") await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ json: searchResponse(query === "empty" ? 0 : 2, query) }).catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("combobox").fill("empty");
  await page.getByRole("combobox").press("Enter");
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "slow-burn neo-noir crime thrillers" })).toBeVisible();
  await page.getByRole("button", { name: "slow-burn neo-noir crime thrillers" }).click();
  await expect(page.getByRole("button", { name: "Cancel search" })).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.waitForTimeout(700);
  await expect(page.getByRole("heading", { name: "CINEMATCH" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

for (const width of [390, 768, 1440]) {
  test(`results fit ${width}px and score tooltip remains inside card`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/suggest?**", route => route.fulfill({ json: [] }));
    await page.route("**/api/search", route => route.fulfill({ json: searchResponse(6) }));
    await page.goto("/");
    await page.getByRole("combobox").fill("sci-fi");
    await page.getByRole("combobox").press("Enter");
    await expect(page.getByRole("article")).toHaveCount(6);
    await page.getByRole("button", { name: "Hybrid match score 92 percent" }).first().click();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    const card = await page.getByRole("article").first().boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(card!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(card!.x + card!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `generated-artifacts/results-${width}.png`, fullPage: true });
  });
}
