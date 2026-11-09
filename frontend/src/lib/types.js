/**
 * types.js — JSDoc type definitions for the PlotSense API.
 * No runtime code — imported only for editor intelligence.
 */

/**
 * @typedef {Object} Suggestion
 * @property {string} id
 * @property {string} title
 * @property {number | null} year
 * @property {string | null} poster_url
 */

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} lexical
 * @property {number | null} lexical_rank
 * @property {number} semantic
 * @property {number | null} semantic_rank
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {string} title
 * @property {number | null} year
 * @property {string | null} poster_url
 * @property {string[]} genres
 * @property {number} score
 * @property {ScoreBreakdown} scores
 * @property {string[]} [match_terms]
 * @property {string | null} [reason]
 * @property {number | null} [vote_average]
 * @property {number} [vote_count]
 * @property {number | null} [runtime]
 * @property {string | null} [language]
 * @property {string | null} [tagline]
 * @property {string | null} [overview]
 * @property {string | null} [director]
 * @property {string[]} [cast]
 * @property {string[]} [keywords]
 */

/**
 * @typedef {Object} Movie
 * @property {string} id
 * @property {string} title
 * @property {number | null} year
 * @property {string | null} poster_url
 * @property {string[]} genres
 * @property {number | null} vote_average
 * @property {number} vote_count
 * @property {number | null} runtime
 * @property {string | null} language
 * @property {string | null} tagline
 * @property {string | null} overview
 * @property {string | null} director
 * @property {string[]} cast
 * @property {string[]} keywords
 */

/**
 * @typedef {Object} ParsedQuery
 * @property {'recommend' | 'find_title' | 'similar'} intent
 * @property {string[]} genres
 * @property {string[]} moods
 * @property {string | null} similar_to
 * @property {number | null} era_from
 * @property {number | null} era_to
 * @property {number | null} min_rating
 * @property {string[]} negations
 */

/**
 * @typedef {Object} EngineInfo
 * @property {string} fusion
 * @property {boolean} rerank
 * @property {string} embedding_model
 * @property {string | null} reranker_model
 * @property {number} corpus_size
 */

/**
 * @typedef {Object} Timing
 * @property {number} total
 * @property {number} [lexical]
 * @property {number} [semantic]
 * @property {number} [fusion]
 * @property {number} [rerank]
 */

/**
 * @typedef {Object} SearchResponse
 * @property {SearchResult[]} results
 * @property {ParsedQuery} parsed
 * @property {EngineInfo} engine
 * @property {Timing} timing_ms
 */

/**
 * @typedef {Object} StatsResponse
 * @property {number} corpus_size
 * @property {string[]} sample_queries
 * @property {Array<{id: string, title: string, year: number | null, poster_url: string | null}>} top_rated
 */

/**
 * @typedef {Object} SearchRequest
 * @property {string} query
 * @property {'rrf' | 'weighted'} [fusion]
 * @property {number} [lexical_weight]
 * @property {number} [semantic_weight]
 * @property {boolean} [rerank]
 * @property {boolean} [explain]
 */

export {};

