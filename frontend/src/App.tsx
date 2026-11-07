import { motion, useReducedMotion } from "framer-motion";
import { Atmosphere } from "./components/Atmosphere";
import { Wordmark } from "./components/Wordmark";
import { useEffect, useRef, useState } from "react";
import { SearchConsole, controlsToRequest, DEFAULT_CONTROLS, type EngineControls } from "./components/SearchConsole";
import { search } from "./lib/api";

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
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error" | "cancelled">("idle");
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
    setValue(query);
    setPhase("loading");
    setMessage("Searching…");
    try {
      const response = await search(controlsToRequest(query, nextControls), { signal: controller.signal });
      if (controller.signal.aborted || pending.current !== controller) return;
      setPhase("success");
      setMessage(`Search complete: ${response.count} ${response.count === 1 ? "match" : "matches"}. Results display is not yet enabled.`);
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

  return (
    <>
      <Atmosphere />
      <div className="relative z-10">
        <main className="relative min-h-screen">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-16 sm:pt-24">
              <Wordmark />
              <div className="mt-10 w-full">
                <SearchConsole
                  value={value}
                  onChange={setValue}
                  onSubmit={(query) => { void runSearch(query); }}
                  onSelectSuggestion={(suggestion) => { void runSearch(suggestion.title); }}
                  controls={controls}
                  onControlsChange={changeControls}
                  placeholders={PLACEHOLDERS}
                />
                <div className="mt-4 text-sm text-ink-2" aria-busy={phase === "loading"}>
                  {phase === "error" ? <p role="alert">{message}</p> : <p role="status">{message}</p>}
                  {phase === "loading" && (
                    <button className="mt-2 rounded-btn border border-line px-3 py-1 text-amber" onClick={cancelSearch}>Cancel search</button>
                  )}
                  {phase === "error" && (
                    <button className="mt-2 rounded-btn border border-line px-3 py-1 text-amber" onClick={() => { void runSearch(lastQuery.current); }}>Retry search</button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

export default App;
