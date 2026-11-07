import type {
  HealthResponse, Movie, SearchRequest, SearchResponse, StatsResponse, Suggestion,
} from "./types";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
}

/** Base URL is the backend origin, without /api. Empty means same-origin. */
export function createApiClient(baseUrl = "") {
  const base = baseUrl.trim().replace(/\/+$/, "");

  async function request<T>(
    path: string, init: RequestInit = {}, options: RequestOptions = {},
  ): Promise<T> {
    // Propagate cancellation, HTTP and transport errors: no fabricated responses.
    const response = await fetch(`${base}/api${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      signal: options.signal,
    });
    const json = response.headers.get("content-type")?.includes("application/json");
    const body: unknown = json ? await response.json() : await response.text();
    if (!response.ok) {
      const detail = body && typeof body === "object" && "detail" in body
        ? body.detail : undefined;
      throw new ApiError(
        typeof detail === "string" ? detail : `Movie API request failed (${response.status}).`,
        response.status,
        body,
      );
    }
    if (!json) {
      throw new ApiError(
        "Expected JSON from the movie API. Check the backend URL or API proxy.",
        response.status,
      );
    }
    return body as T;
  }

  return {
    getHealth: (options?: RequestOptions) =>
      request<HealthResponse>("/health", {}, options),
    getStats: (options?: RequestOptions) =>
      request<StatsResponse>("/stats", {}, options),
    suggest: (query: string, limit = 8, options?: RequestOptions) => {
      const q = query.trim();
      if (!q) return Promise.resolve<Suggestion[]>([]);
      const params = new URLSearchParams({ q, limit: String(limit) });
      return request<Suggestion[]>(`/suggest?${params}`, {}, options);
    },
    search: (input: SearchRequest, options?: RequestOptions) =>
      request<SearchResponse>("/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }, options),
    getMovie: (id: string, options?: RequestOptions) =>
      request<Movie>(`/movie/${encodeURIComponent(id)}`, {}, options),
    getSimilar: (id: string, limit = 12, options?: RequestOptions) =>
      request<SearchResponse>(
        `/movie/${encodeURIComponent(id)}/similar?limit=${encodeURIComponent(limit)}`,
        {}, options,
      ),
  };
}

const api = createApiClient(import.meta.env?.VITE_API_URL ?? "");
export const { getHealth, getStats, suggest, search, getMovie, getSimilar } = api;
