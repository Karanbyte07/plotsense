import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApiClient, ApiError } from "../src/lib/api.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("all six endpoints preserve paths, payloads and request signals", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return Response.json({ marker: "server response" });
  };
  const api = createApiClient("https://movies.example.test///");
  const signal = new AbortController().signal;
  const payload = { query: "noir & sci-fi", fusion: "weighted", lexical_weight: 0.2, semantic_weight: 0.8, rerank: false };
  assert.deepEqual(await api.getHealth(), { marker: "server response" });
  await api.getStats();
  await api.suggest("  noir & sci-fi  ");
  await api.search(payload, { signal });
  await api.getMovie("a/b ?#");
  await api.getSimilar("a/b", 8);
  assert.deepEqual(calls.map(c => c.url), [
    "https://movies.example.test/api/health",
    "https://movies.example.test/api/stats",
    "https://movies.example.test/api/suggest?q=noir+%26+sci-fi&limit=8",
    "https://movies.example.test/api/search",
    "https://movies.example.test/api/movie/a%2Fb%20%3F%23",
    "https://movies.example.test/api/movie/a%2Fb/similar?limit=8",
  ]);
  assert.equal(calls[3].init.method, "POST");
  assert.equal(calls[3].init.headers["Content-Type"], "application/json");
  assert.equal(calls[3].init.signal, signal);
  assert.deepEqual(JSON.parse(calls[3].init.body), payload);
});

test("same-origin URLs and blank autocomplete", async () => {
  let called = false;
  globalThis.fetch = async url => {
    called = true;
    assert.equal(url, "/api/stats");
    return Response.json({ corpus_size: 0 });
  };
  const api = createApiClient();
  assert.deepEqual(await api.suggest(" "), []);
  assert.equal(called, false);
  assert.deepEqual(await api.getStats(), { corpus_size: 0 });
});

test("HTTP failures retain status and validation details", async () => {
  for (const status of [404, 422, 503]) {
    const detail = status === 422 ? [{ msg: "Invalid query" }] : "engine not ready";
    globalThis.fetch = async () => Response.json({ detail }, { status });
    await assert.rejects(createApiClient().getStats(), error => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.deepEqual(error.details, { detail });
      return true;
    });
  }
});

test("HTML fallback, malformed JSON, transport and cancellation fail explicitly", async () => {
  globalThis.fetch = async () => new Response("<html>Vite fallback</html>", { headers: { "Content-Type": "text/html" } });
  await assert.rejects(createApiClient().getStats(), /Expected JSON/);
  globalThis.fetch = async () => new Response("{", { headers: { "Content-Type": "application/json" } });
  await assert.rejects(createApiClient().getStats(), SyntaxError);
  for (const error of [new TypeError("Network unavailable"), new DOMException("Aborted", "AbortError")]) {
    globalThis.fetch = async () => { throw error; };
    await assert.rejects(createApiClient().getStats(), value => value === error);
  }
});
