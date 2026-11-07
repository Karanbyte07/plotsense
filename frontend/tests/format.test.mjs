import { test } from "node:test";
import assert from "node:assert/strict";
import * as f from "../src/lib/format.ts";

test("formats movie metadata without inventing missing values", () => {
  assert.equal(f.safeYear(1999), 1999);
  for (const invalid of [null, undefined, 0, NaN, Infinity, 1999.5]) assert.equal(f.safeYear(invalid), null);
  assert.equal(f.formatCount(12345), "12,345");
  assert.equal(f.formatCount(null), "—");
  assert.equal(f.formatRuntime(142), "2h 22m");
  assert.equal(f.formatRuntime(120), "2h");
  assert.equal(f.formatRuntime(45), "45m");
  assert.equal(f.formatRuntime(null), null);
  assert.equal(f.formatRating(8), "8.0");
  assert.equal(f.formatRating(null), "—");
  assert.equal(f.formatLanguage("en"), "English");
  assert.equal(f.formatLanguage(null), "Unknown");
});

test("formats scores and telemetry for reference consumers", () => {
  assert.equal(f.toPercent(0.826), 83);
  assert.equal(f.toPercent(2), 100);
  assert.equal(f.toPercent(-1), 0);
  assert.equal(f.toPercent(NaN), 0);
  assert.equal(f.formatMs(123.4), "123");
  assert.equal(f.shortModel("BAAI/bge-small-en-v1.5"), "bge-small-en-v1.5");
  assert.equal(f.shortModel(null), "—");
  for (const title of ["Inception", "", "A long movie title", "映画"]) {
    const hue = f.posterFallbackSeed(title);
    assert.equal(hue, f.posterFallbackSeed(title));
    assert.ok(hue >= 0 && hue < 360);
  }
});
