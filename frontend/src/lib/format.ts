type MaybeNumber = number | null | undefined;
const valid = (value: MaybeNumber): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function safeYear(value: MaybeNumber): number | null {
  return valid(value) && Number.isInteger(value) && value > 0 ? value : null;
}

export function formatCount(value: MaybeNumber): string {
  return valid(value) && value >= 0
    ? Math.round(value).toLocaleString("en-US") : "—";
}

export function formatRuntime(value: MaybeNumber): string | null {
  if (!valid(value) || value <= 0) return null;
  const minutes = Math.round(value);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${minutes}m`;
}

export function formatRating(value: MaybeNumber): string {
  return valid(value) && value >= 0 && value <= 10 ? value.toFixed(1) : "—";
}

/** The reference appends the ms unit itself. */
export function formatMs(value: MaybeNumber): string {
  return valid(value) && value >= 0 ? Math.round(value).toLocaleString("en-US") : "—";
}

export function shortModel(value: string | null | undefined): string {
  return value?.split("/").filter(Boolean).pop() ?? "—";
}

export function toPercent(value: MaybeNumber): number {
  return valid(value) ? Math.round(Math.min(1, Math.max(0, value)) * 100) : 0;
}

export function formatLanguage(code: string | null | undefined): string {
  if (!code?.trim()) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code.trim()) ?? code;
  } catch {
    return code;
  }
}

/** Stable hue for the reference's missing-poster treatment, not replacement data. */
export function posterFallbackSeed(title: string): number {
  let hash = 0;
  for (const character of title) hash = (Math.imul(hash, 31) + character.codePointAt(0)!) | 0;
  return ((hash % 360) + 360) % 360;
}
