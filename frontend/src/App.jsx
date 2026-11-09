import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMovie, getStats, search } from '@/lib/api';
import { Atmosphere } from '@/components/Atmosphere';
import { EmptyState } from '@/components/EmptyState';
import { QueryInsight } from '@/components/QueryInsight';
import { ResultsGrid } from '@/components/ResultsGrid';
import { ResultsSkeleton } from '@/components/skeletons/ResultsSkeleton';
import { MovieDetail } from '@/components/MovieDetail';
import { ErrorState } from '@/components/states/ErrorState';
import { NoResults } from '@/components/states/NoResults';
import { Wordmark } from '@/components/Wordmark';
import { SearchConsole, DEFAULT_CONTROLS, controlsToRequest } from '@/components/SearchConsole';
import { formatCount } from '@/lib/format';

/** @typedef {'idle' | 'loading' | 'results' | 'no-results' | 'error'} Phase */

const FALLBACK_PLACEHOLDERS = [
  'mind-bending sci-fi like Inception but with more heart',
  'slow-burn neo-noir crime thrillers',
  'movies that feel like a fever dream',
];

const EASE = [0.16, 1, 0.3, 1];

export default function App() {
  /** @type {[Phase, React.Dispatch<Phase>]} */
  const [phase, setPhase] = useState('idle');
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [controls, setControls] = useState(DEFAULT_CONTROLS);

  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [parsed, setParsed] = useState(null);
  const [engine, setEngine] = useState(null);
  const [timing, setTiming] = useState(null);
  const [detail, setDetail] = useState(null);

  // Guards against out-of-order responses when queries fire quickly.
  const requestSeq = useRef(0);
  const lastQuery = useRef('');

  const placeholders = stats?.sample_queries ?? FALLBACK_PLACEHOLDERS;
  const searchable = phase !== 'idle';

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  const runSearch = useCallback(async (rawQuery, ctrl) => {
    const q = rawQuery.trim();
    if (!q) return;
    const seq = ++requestSeq.current;
    lastQuery.current = q;

    setQuery(q);
    setInputValue(q);
    setPhase('loading');

    try {
      const res = await search(controlsToRequest(q, ctrl));
      if (seq !== requestSeq.current) return; // stale
      setResults(res.results);
      setParsed(res.parsed);
      setEngine(res.engine);
      setTiming(res.timing_ms);
      setPhase(res.results.length > 0 ? 'results' : 'no-results');
    } catch {
      if (seq !== requestSeq.current) return;
      setPhase('error');
    }
  }, []);

  const handleSubmit = useCallback(
    (q) => {
      runSearch(q, controls);
    },
    [runSearch, controls]
  );

  // Changing engine controls re-runs the current query.
  const handleControlsChange = useCallback(
    (next) => {
      setControls(next);
      if (lastQuery.current && phase !== 'idle' && phase !== 'loading') {
        runSearch(lastQuery.current, next);
      }
    },
    [runSearch, phase]
  );

  const handleSelectSuggestion = useCallback(
    (s) => {
      setInputValue(s.title);
      runSearch(s.title, controls);
    },
    [runSearch, controls]
  );

  const handleSimilar = useCallback(
    (id) => {
      const movie = results.find((r) => r.id === id);
      const title = movie?.title ?? id;
      runSearch(`like ${title}`, controls);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [runSearch, controls, results]
  );

  const handleOpenDetail = useCallback((result) => {
    setDetail(result);
  }, []);

  const handleOpenMovieById = useCallback(async (id) => {
    const movie = await getMovie(id);
    if (movie) setDetail(movie);
  }, []);

  const console_ = (
    <SearchConsole
      value={inputValue}
      onChange={setInputValue}
      onSubmit={handleSubmit}
      onSelectSuggestion={handleSelectSuggestion}
      controls={controls}
      onControlsChange={handleControlsChange}
      placeholders={placeholders}
      compact={searchable}
      autoFocus={false}
    />
  );

  return (
    <>
      <Atmosphere />
      <div className="relative z-10">
        <LayoutGroup>
          <main className="relative min-h-screen">
            <AnimatePresence mode="wait">
              {phase === 'idle' ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <EmptyState
                    stats={stats}
                    onPickQuery={(q) => runSearch(q, controls)}
                    onPickMovie={handleOpenMovieById}
                  >
                    {console_}
                  </EmptyState>
                </motion.div>
              ) : (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {/* Sticky compact top bar */}
                  <div className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-start lg:gap-6">
                      <button
                        type="button"
                        onClick={() => {
                          setPhase('idle');
                          setInputValue('');
                          setQuery('');
                          lastQuery.current = '';
                        }}
                        aria-label="Back to home"
                        className="shrink-0 self-start rounded-btn py-1 pr-2 transition-opacity hover:opacity-80 lg:pt-1.5"
                      >
                        <Wordmark compact />
                      </button>
                      <div className="min-w-0 flex-1">{console_}</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                    {phase === 'loading' && <ResultsSkeleton count={10} />}

                    {phase === 'error' && (
                      <div className="py-12">
                        <ErrorState
                          query={query}
                          onRetry={() => runSearch(query || lastQuery.current, controls)}
                        />
                      </div>
                    )}

                    {phase === 'no-results' && (
                      <div className="py-12">
                        <NoResults
                          query={query}
                          samples={placeholders}
                          onPickQuery={(q) => runSearch(q, controls)}
                        />
                      </div>
                    )}

                    {phase === 'results' && parsed && engine && timing && (
                      <div className="space-y-6">
                        <QueryInsight
                          parsed={parsed}
                          engine={engine}
                          timing={timing}
                        />

                        <div className="flex items-baseline justify-between">
                          <h2 className="font-display text-lg font-semibold text-ink">
                            {results.length} result
                            {results.length === 1 ? '' : 's'}
                          </h2>
                          <span className="telemetry text-[11px] text-ink-3">
                            of {formatCount(engine.corpus_size)} films
                          </span>
                        </div>

                        <ResultsGrid
                          key={query}
                          results={results}
                          onOpen={handleOpenDetail}
                          onSimilar={handleSimilar}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <MovieDetail
              movie={detail}
              onClose={() => setDetail(null)}
              onSelectSimilar={(r) => setDetail(r)}
            />
          </main>
        </LayoutGroup>
      </div>
    </>
  );
}
