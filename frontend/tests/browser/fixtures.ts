/** Test-only API responses; never imported by application code. */
export function searchResponse(count = 2, query = "Inception") {
  return {
    query, count,
    parsed: { intent: "recommend", clean_query: query, genres: ["Science Fiction"], moods: [], era_from: null, era_to: null, similar_to: null, keywords: [], negations: [], min_rating: null, source: "rules" },
    engine: { fusion: "rrf", rerank: true, embedding_model: "BAAI/bge-small-en-v1.5", reranker_model: "cross-encoder/ms-marco-MiniLM-L-6-v2", slm: "rules", corpus_size: 9500 },
    timing_ms: { parse: 1, lexical: 2, semantic: 3, fusion: 1, rerank: 4, reason: 1, total: 12 },
    results: Array.from({ length: count }, (_, i) => ({
      id: String(i + 1), tmdb_id: null, title: i === 0 ? "Inception" : `Film ${i + 1}`,
      year: 2010, genres: ["Science Fiction", "Thriller"], overview: "A test-only movie overview.",
      tagline: null, poster_url: null, vote_average: 8.8, vote_count: 100, popularity: 1,
      language: "en", cast: [], director: null, keywords: [], runtime: 148,
      score: 0.92, scores: { lexical: 0.81, semantic: 0.95, fusion: 0.9, rerank: 0.92, lexical_rank: i + 1, semantic_rank: i + 1 },
      match_terms: ["dream"], reason: "Dreams and reality overlap in this science fiction thriller.",
    })),
  };
}
