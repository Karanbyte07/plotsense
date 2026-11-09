/**
 * api.js — All fetch calls to the PlotSense FastAPI backend.
 *
 * Base URL is read from the VITE_API_URL environment variable.
 * Never hardcode secrets or base URLs here.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/** @param {string} path @param {RequestInit} [opts] */
async function req(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * GET /api/stats
 * @returns {Promise<import('./types').StatsResponse>}
 */
export function getStats() {
  return req('/api/stats');
}

/**
 * GET /api/suggest?q=&limit=
 * @param {string} q
 * @param {number} [limit=8]
 * @returns {Promise<import('./types').Suggestion[]>}
 */
export function suggest(q, limit = 8) {
  return req(`/api/suggest?q=${encodeURIComponent(q)}&limit=${limit}`);
}

/**
 * POST /api/search
 * @param {import('./types').SearchRequest} body
 * @returns {Promise<import('./types').SearchResponse>}
 */
export function search(body) {
  return req('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * GET /api/movie/{id}
 * @param {string} id
 * @returns {Promise<import('./types').Movie | null>}
 */
export async function getMovie(id) {
  try {
    return await req(`/api/movie/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

/**
 * GET /api/movie/{id}/similar?limit=
 * @param {string} id
 * @param {number} [limit=8]
 * @returns {Promise<import('./types').SearchResponse>}
 */
export function getSimilar(id, limit = 8) {
  return req(`/api/movie/${encodeURIComponent(id)}/similar?limit=${limit}`);
}

