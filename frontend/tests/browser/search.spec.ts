import { test, expect } from "@playwright/test";
import { searchResponse } from "./fixtures";

const suggestions = [
  { id: "1", title: "Inception", year: 2010, poster_url: null },
  { id: "2", title: "Interstellar", year: 2014, poster_url: null },
];

test("debounce, minimum length, keyboard selection, controls and request payload", async ({ page }) => {
  const requests: string[] = [];
  const searches: Record<string, unknown>[] = [];
  await page.route("**/api/suggest?**", async route => {
    requests.push(route.request().url());
    await route.fulfill({ json: suggestions });
  });
  await page.route("**/api/search", async route => {
    searches.push(route.request().postDataJSON());
    await route.fulfill({ json: searchResponse(2) });
  });
  await page.goto("/");
  const input = page.getByRole("combobox");
  await expect(input).toBeVisible();
  await page.keyboard.press("/");
  await expect(input).toBeFocused();
  await input.fill("i");
  await page.waitForTimeout(230);
  expect(requests).toHaveLength(0);
  await input.fill("in");
  await input.fill("int");
  await expect(page.getByRole("option")).toHaveCount(2);
  expect(requests).toHaveLength(1);
  await input.press("ArrowUp");
  await expect(page.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("Inception");
  await expect(page.getByRole("status")).toContainText("2 matches");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  expect(searches[0]).toEqual({
    query: "Inception", fusion: "rrf", lexical_weight: 0.5,
    semantic_weight: 0.5, rerank: true, explain: true,
  });
  await page.getByRole("button", { name: "engine +" }).click();
  await page.getByRole("radio", { name: "Weighted" }).click();
  const slider = page.getByRole("slider");
  await slider.fill("70");
  await page.getByRole("switch").click();
  await expect.poll(() => searches.at(-1)).toEqual({
    query: "Inception", fusion: "weighted", lexical_weight: 0.7,
    semantic_weight: 0.3, rerank: false, explain: true,
  });
  await expect(page.getByText("lex 70", { exact: true })).toBeVisible();
  await expect(page.getByText("sem 30", { exact: true })).toBeVisible();
});

test("visible failures, retry, blank queries and cancellation", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/suggest?**", route => route.fulfill({ status: 503, json: { detail: "Offline" } }));
  await page.route("**/api/search", async route => {
    calls++;
    if (calls === 1) await route.fulfill({ status: 503, json: { detail: "Engine unavailable" } });
    else {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ json: searchResponse(7) }).catch(() => {});
    }
  });
  await page.goto("/");
  const input = page.getByRole("combobox");
  await input.fill("  ");
  await input.press("Enter");
  expect(calls).toBe(0);
  await input.fill("noir");
  await expect(page.getByText("Suggestions unavailable. You can still search.")).toBeVisible();
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Engine unavailable");
  await page.getByRole("button", { name: "Retry search" }).click();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(page.getByRole("status")).toHaveText("Search cancelled.");
  await page.waitForTimeout(650);
  await expect(page.getByRole("status")).toHaveText("Search cancelled.");
});

test("stale autocomplete cannot replace newer options; Escape and blur dismiss", async ({ page }) => {
  await page.route("**/api/suggest?**", async route => {
    const old = new URL(route.request().url()).searchParams.get("q") === "old";
    if (old) await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ json: old ? [{ ...suggestions[0], title: "Old result" }] : suggestions }).catch(() => {});
  });
  await page.goto("/");
  const input = page.getByRole("combobox");
  await input.fill("old");
  await page.waitForTimeout(250);
  await input.fill("new");
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.waitForTimeout(650);
  await expect(page.getByText("Old result", { exact: true })).toHaveCount(0);
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.focus();
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("radio", { name: "Weighted" }).click();
  await expect(input).toHaveAttribute("aria-expanded", "false");
});

test("new searches replace in-flight searches and suggestion clicks submit once", async ({ page }) => {
  const queries: string[] = [];
  await page.route("**/api/suggest?**", route => route.fulfill({ json: suggestions }));
  await page.route("**/api/search", async route => {
    const query = route.request().postDataJSON().query;
    queries.push(query);
    if (query === "old") await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ json: searchResponse(query === "old" ? 99 : 2) }).catch(() => {});
  });
  await page.goto("/");
  const input = page.getByRole("combobox");
  await input.fill("old");
  await input.press("Enter");
  await input.fill("new");
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("option").first().click();
  await expect(page.getByRole("status")).toContainText("2 matches");
  await page.waitForTimeout(700);
  await expect(page.getByRole("status")).toContainText("2 matches");
  expect(queries).toEqual(["old", "Inception"]);
});

test("mobile touch selection and console fit the viewport", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.route("**/api/suggest?**", route => route.fulfill({ json: suggestions }));
  await page.route("**/api/search", route => route.fulfill({ json: searchResponse(1) }));
  await page.goto("/");
  await page.getByRole("combobox").fill("in");
  await page.getByRole("option").first().tap();
  await expect(page.getByRole("status")).toContainText("1 match.");
  await page.getByRole("button", { name: "engine +" }).tap();
  await page.getByRole("radio", { name: "Weighted" }).tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("unconfigured backend shows a real configuration failure instead of fake data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").fill("noir");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Movie API request failed (404).");
  await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
});
