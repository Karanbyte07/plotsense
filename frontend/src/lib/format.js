/**
 * format.js — Pure formatting helpers shared across components.
 */

/**
 * Format a large number with compact suffix (e.g. 9500 → "9.5k").
 * @param {number | null | undefined} n
 * @returns {string}
 */
export function formatCount(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Safely parse a year value that may come as a number or string.
 * Returns null if the value is falsy or not a valid year.
 * @param {number | string | null | undefined} raw
 * @returns {number | null}
 */
export function safeYear(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (isNaN(n) || n < 1888 || n > 2100) return null;
  return n;
}

/**
 * Convert a 0-1 score to a 0-100 integer percentage.
 * @param {number} score
 * @returns {number}
 */
export function toPercent(score) {
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}

/**
 * Format a vote_average to one decimal place, or null if unavailable.
 * @param {number | null | undefined} avg
 * @returns {string | null}
 */
export function formatRating(avg) {
  if (avg == null || avg === 0) return null;
  return avg.toFixed(1);
}

/**
 * Format runtime in minutes to "Xh Ym", or null if unavailable.
 * @param {number | null | undefined} mins
 * @returns {string | null}
 */
export function formatRuntime(mins) {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format a millisecond timing value to a human-readable string.
 * @param {number | null | undefined} ms
 * @returns {string}
 */
export function formatMs(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return ms.toFixed(0);
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Map a language code to a readable label.
 * @param {string | null | undefined} code
 * @returns {string | null}
 */
export function formatLanguage(code) {
  if (!code) return null;
  const map = {
    en: 'English', fr: 'French', de: 'German', es: 'Spanish',
    it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
    pt: 'Portuguese', ru: 'Russian', hi: 'Hindi',
  };
  return map[code] ?? code.toUpperCase();
}

/**
 * Shorten a model name for display (e.g. "BAAI/bge-small-en-v1.5" → "bge-small").
 * @param {string | null | undefined} model
 * @returns {string}
 */
export function shortModel(model) {
  if (!model) return '—';
  // Strip org prefix
  const name = model.includes('/') ? model.split('/').pop() : model;
  // Strip version suffix like -v1.5
  return (name ?? model).replace(/-v[\d.]+$/, '');
}

/**
 * Generate a deterministic hue from a movie title string (for the
 * poster fallback background gradient).
 * @param {string} title
 * @returns {number} 0-360
 */
export function posterFallbackSeed(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

