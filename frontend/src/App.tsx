import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { Atmosphere } from "./components/Atmosphere";
import { Wordmark } from "./components/Wordmark";
import { useEffect, useRef, useState } from "react";
import { SearchConsole, controlsToRequest, DEFAULT_CONTROLS, type EngineControls } from "./components/SearchConsole";
import { QueryInsight } from "./components/QueryInsight";
import { ResultsGrid } from "./components/ResultsGrid";
import { ResultsSkeleton } from "./components/skeletons/ResultsSkeleton";
import { ErrorState } from "./components/states/ErrorState";
import { NoResults } from "./components/states/NoResults";
import { search } from "./lib/api";
import { formatCount } from "./lib/format";
import type { SearchResponse } from "./lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const PLACEHOLDERS = [
  "mind-bending sci-fi like Inception but with more heart",
  "slow-burn neo-noir crime thrillers",
  "movies that feel like a fever dream",
];

function App() {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [controls, setControls] = useState<EngineControls>(DEFAULT_CONTROLS);
  const [phase, setPhase] = useState<"idle" | "loading" | "results" | "no-results" | "error" | "cancelled">("idle");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef<AbortController | null>(null);
  const lastQuery = useRef("");

  useEffect(() => () => pending.current?.abort(), []);

  async function runSearch(rawQuery: string, nextControls = controls) {
    const query = rawQuery.trim();
    if (!query) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    lastQuery.current = query;
    setQuery(query);
    setValue(query);
    setResponse(null);
    setPhase("loading");
    setMessage("Searching…");
    try {
      const response = await search(controlsToRequest(query, nextControls), { signal: controller.signal });
      if (controller.signal.aborted || pending.current !== controller) return;
      setResponse(response);
      setPhase(response.results.length > 0 ? "results" : "no-results");
      setMessage(`Search complete: ${response.count} ${response.count === 1 ? "match" : "matches"}.`);
    } catch (error) {
      if (controller.signal.aborted || pending.current !== controller) return;
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Search failed. Please try again.");
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  function cancelSearch() {
    pending.current?.abort();
    pending.current = null;
    setPhase("cancelled");
    setMessage("Search cancelled.");
  }

  function changeControls(next: EngineControls) {
    setControls(next);
    if (lastQuery.current && phase !== "idle" && phase !== "cancelled") {
      void runSearch(lastQuery.current, next);
    }
  }

  function returnHome() {
    pending.current?.abort();
    pending.current = null;
    lastQuery.current = "";
    setPhase("idle");
    setValue("");
    setQuery("");
    setResponse(null);
    setMessage("");
  }

  function searchSimilar(id: string) {
    const movie = response?.results.find((result) => result.id === id);
    if (!movie) return;
    void runSearch(`like ${movie.title}`);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  const console = (
    <SearchConsole
      value={value}
      onChange={setValue}
      onSubmit={(nextQuery) => { void runSearch(nextQuery); }}
      onSelectSuggestion={(suggestion) => { void runSearch(suggestion.title); }}
      controls={controls}
      onControlsChange={changeControls}
      placeholders={PLACEHOLDERS}
      compact={phase !== "idle"}
      autoFocus={false}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <Atmosphere />
      <div className="relative z-10">
        <LayoutGroup>
          <main className="relative min-h-[100dvh]">
            <p role="status" className="sr-only">{phase === "error" ? "" : message}</p>
            <AnimatePresence mode="wait">
              {phase === "idle" ? (
                <motion.div
                  key="idle"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}
                >
                  <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-16 sm:pt-24">
                    <Wordmark />
                    <div className="mt-10 w-full">{console}</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="searching"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}
                >
                  <div className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-start lg:gap-6">
                      <button
                        type="button"
                        onClick={returnHome}
                        aria-label="Back to home"
                        className="shrink-0 self-start rounded-btn py-1 pr-2 transition-opacity hover:opacity-80 lg:pt-1.5"
                      >
                        <Wordmark compact />
                      </button>
                      <div className="min-w-0 flex-1">{console}</div>
                    </div>
                  </div>
                  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8" aria-busy={phase === "loading"}>
                    {phase === "loading" && (
                      <>
                        <div className="mb-4 flex justify-end">
                          <button
                            type="button"
                            className="rounded-btn border border-line px-3 py-1 text-[12px] text-amber hover:border-amber-dim"
                            onClick={cancelSearch}
                          >Cancel search</button>
                        </div>
                        <ResultsSkeleton count={10} />
                      </>
                    )}
                    {phase === "error" && (
                      <div className="py-12">
                        <ErrorState query={query} message={message} onRetry={() => { void runSearch(lastQuery.current); }} />
                      </div>
                    )}
                    {phase === "cancelled" && (
                      <div className="surface mx-auto my-12 max-w-md rounded-card p-8 text-center shadow-card">
                        <h2 className="font-display text-lg font-semibold text-ink">Search cancelled.</h2>
                        <p className="mt-2 text-[13px] text-ink-2">Change your query above, or try this search again.</p>
                        <button
                          type="button"
                          className="mt-5 rounded-btn bg-amber px-4 py-2 text-[13px] font-medium text-void hover:bg-amber-hi"
                          onClick={() => { void runSearch(lastQuery.current); }}
                        >Retry search</button>
                      </div>
                    )}
                    {phase === "no-results" && (
                      <div className="py-12">
                        <NoResults query={query} samples={PLACEHOLDERS} onPickQuery={(nextQuery) => { void runSearch(nextQuery); }} />
                      </div>
                    )}
                    {phase === "results" && response && (
                      <div className="space-y-6">
                        <QueryInsight parsed={response.parsed} engine={response.engine} timing={response.timing_ms} />
                        <div className="flex items-baseline justify-between">
                          <h2 className="font-display text-lg font-semibold text-ink">
                            {response.count} result{response.count === 1 ? "" : "s"}
                          </h2>
                          <span className="telemetry text-[11px] text-ink-3">of {formatCount(response.engine.corpus_size)} films</span>
                        </div>
                        <ResultsGrid key={query} results={response.results} onSimilar={searchSimilar} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}

export default App;
