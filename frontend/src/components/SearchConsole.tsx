import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { suggest } from "../lib/api";
import { safeYear } from "../lib/format";
import type { SearchRequest, Suggestion } from "../lib/types";
import { Poster } from "./Poster";
import { ArrowRightIcon, SearchIcon } from "./icons";

const EASE = [0.16, 1, 0.3, 1] as const;

export interface EngineControls {
  fusion: "rrf" | "weighted";
  lexicalWeight: number;
  rerank: boolean;
}

export const DEFAULT_CONTROLS: EngineControls = {
  fusion: "rrf",
  lexicalWeight: 0.5,
  rerank: true,
};

export function controlsToRequest(query: string, controls: EngineControls): SearchRequest {
  return {
    query,
    fusion: controls.fusion,
    lexical_weight: controls.lexicalWeight,
    semantic_weight: Math.round((1 - controls.lexicalWeight) * 100) / 100,
    rerank: controls.rerank,
    explain: true,
  };
}

/** Faithful port of the original focal search console. */
export function SearchConsole({
  value,
  onChange,
  onSubmit,
  onSelectSuggestion,
  controls,
  onControlsChange,
  placeholders,
  compact = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (query: string) => void | Promise<void>;
  onSelectSuggestion: (s: Suggestion) => void | Promise<void>;
  controls: EngineControls;
  onControlsChange: (c: EngineControls) => void;
  placeholders: string[];
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);
  const mounted = useRef(true);
  const listboxId = useId();
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showControls, setShowControls] = useState(!compact);

  const cancelSuggestions = useCallback(() => {
    ++requestSeq.current;
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    cancelSuggestions();
    setDismissed(true);
    setSuggestions([]);
    setActiveIndex(-1);
    setSuggestionError(null);
  }, [cancelSuggestions]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelSuggestions();
    };
  }, [cancelSuggestions]);

  useEffect(() => {
    if (!placeholders.length || value || focused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [placeholders.length, value, focused]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const target = document.activeElement;
      if (
        e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey &&
        target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA" &&
        target?.tagName !== "SELECT" && !(target instanceof HTMLElement && target.isContentEditable)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    cancelSuggestions();
    setSuggestions([]);
    setActiveIndex(-1);
    setSuggestionError(null);
    const q = value.trim();
    if (!focused || dismissed || q.length < 2) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const seq = requestSeq.current;
    const id = window.setTimeout(() => {
      void suggest(q, 8, { signal: controller.signal }).then(
        (res) => {
          if (!mounted.current || controller.signal.aborted || seq !== requestSeq.current) return;
          setSuggestions(res);
          setActiveIndex(-1);
        },
        () => {
          if (!mounted.current || controller.signal.aborted || seq !== requestSeq.current) return;
          setSuggestions([]);
          setSuggestionError("Suggestions unavailable. You can still search.");
        },
      );
    }, 180);
    return () => {
      window.clearTimeout(id);
      controller.abort();
      if (seq === requestSeq.current) ++requestSeq.current;
    };
  }, [value, focused, dismissed, cancelSuggestions]);

  const dropdownOpen = focused && !dismissed && suggestions.length > 0;

  useEffect(() => {
    if (dropdownOpen && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeIndex, dropdownOpen]);

  const runAction = (action: () => void | Promise<void>) => {
    setActionError(null);
    try {
      void Promise.resolve(action()).catch(() => {
        if (mounted.current) setActionError("Search could not be completed. Please try again.");
      });
    } catch {
      if (mounted.current) setActionError("Search could not be completed. Please try again.");
    }
  };

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    dismiss();
    inputRef.current?.blur();
    runAction(() => onSubmit(trimmed));
  };

  const selectSuggestion = (s: Suggestion) => {
    dismiss();
    inputRef.current?.blur();
    runAction(() => onSelectSuggestion(s));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (dismissed) setDismissed(false);
      if (dropdownOpen) {
        setActiveIndex((i) => e.key === "ArrowDown"
          ? (i + 1) % suggestions.length
          : (i <= 0 ? suggestions.length - 1 : i - 1));
      }
    } else if (dropdownOpen && (e.key === "Home" || e.key === "End")) {
      e.preventDefault();
      setActiveIndex(e.key === "Home" ? 0 : suggestions.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else submit(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      dismiss();
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); submit(value); }} role="search">
        <div
          className={`surface relative flex items-center gap-3 rounded-card transition-all duration-300 ${
            compact ? "px-3 py-2" : "px-4 py-3"
          } ${focused ? "border-amber-dim shadow-amber-glow" : "shadow-card hover:border-line-strong"}`}
        >
          <SearchIcon size={compact ? 18 : 20} className={focused ? "text-amber" : "text-ink-3"} />
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                cancelSuggestions();
                setSuggestions([]);
                setActiveIndex(-1);
                setSuggestionError(null);
                setActionError(null);
                setDismissed(false);
                onChange(e.target.value);
              }}
              onFocus={() => { setFocused(true); setDismissed(false); }}
              onBlur={() => { setFocused(false); dismiss(); }}
              onKeyDown={onKeyDown}
              placeholder=""
              autoComplete="off"
              role="combobox"
              aria-label="Search movies"
              aria-autocomplete="list"
              aria-expanded={dropdownOpen}
              aria-controls={dropdownOpen ? listboxId : undefined}
              aria-describedby={suggestionError || actionError ? `${listboxId}-error` : undefined}
              aria-activedescendant={dropdownOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
              className={`w-full bg-transparent text-ink outline-none placeholder:text-ink-3 ${compact ? "text-md" : "text-md sm:text-lg"}`}
            />
            {!value && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className={`truncate text-ink-3 ${compact ? "text-md" : "text-md sm:text-lg"}`}
                  >
                    {placeholders[placeholderIndex % placeholders.length] ?? "Search films…"}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>
          {!compact && (
            <kbd className="telemetry hidden shrink-0 rounded border border-line-strong px-1.5 py-0.5 text-[11px] text-ink-3 sm:block">/</kbd>
          )}
          <button
            type="submit"
            aria-label="Search"
            className={`flex shrink-0 items-center gap-1.5 rounded-btn bg-amber font-medium text-void transition-transform duration-200 hover:bg-amber-hi active:scale-95 ${
              compact ? "px-2.5 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]"
            }`}
          >
            {compact ? <ArrowRightIcon size={16} /> : <>Search<ArrowRightIcon size={15} /></>}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="surface absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-card p-1.5 shadow-panel"
          >
            {suggestions.map((s, i) => {
              const yr = safeYear(s.year);
              const active = i === activeIndex;
              return (
                <li key={s.id} id={`${listboxId}-opt-${i}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 rounded-btn px-2 py-1.5 text-left transition-colors ${
                      active ? "bg-amber/[0.08]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-void">
                      <Poster url={s.poster_url} title={s.title} year={yr} sizes="32px" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{s.title}</span>
                    {yr != null && <span className="telemetry text-[11px] text-ink-3">{yr}</span>}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {(suggestionError || actionError) && (
        <p id={`${listboxId}-error`} role="status" className="mt-2 px-1 text-[12px] text-danger">
          {actionError ?? suggestionError}
        </p>
      )}
      <EngineControlsRow
        controls={controls}
        onChange={onControlsChange}
        compact={compact}
        expanded={showControls}
        onToggle={() => setShowControls((s) => !s)}
      />
    </div>
  );
}

function EngineControlsRow({
  controls, onChange, compact, expanded, onToggle,
}: {
  controls: EngineControls;
  onChange: (c: EngineControls) => void;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${compact ? "mt-2" : "mt-3 px-1"}`}>
      {compact && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="telemetry text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink-2"
        >
          engine {expanded ? "−" : "+"}
        </button>
      )}
      {(!compact || expanded) && (
        <>
          <FusionToggle value={controls.fusion} onChange={(fusion) => onChange({ ...controls, fusion })} />
          <AnimatePresence initial={false}>
            {controls.fusion === "weighted" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <WeightSlider value={controls.lexicalWeight} onChange={(lexicalWeight) => onChange({ ...controls, lexicalWeight })} />
              </motion.div>
            )}
          </AnimatePresence>
          <RerankSwitch value={controls.rerank} onChange={(rerank) => onChange({ ...controls, rerank })} />
        </>
      )}
    </div>
  );
}

function FusionToggle({
  value, onChange,
}: {
  value: "rrf" | "weighted";
  onChange: (v: "rrf" | "weighted") => void;
}) {
  const instanceId = useId();
  return (
    <div className="flex items-center gap-2">
      <span className="label-eyebrow">Fusion</span>
      <div role="radiogroup" aria-label="Fusion strategy" className="relative flex rounded-btn border border-line bg-black/30 p-0.5">
        {(["rrf", "weighted"] as const).map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(opt)}
              onKeyDown={(e) => {
                if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) {
                  e.preventDefault();
                  const next = e.key === "Home" ? "rrf" : e.key === "End" ? "weighted" : value === "rrf" ? "weighted" : "rrf";
                  onChange(next);
                  const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button");
                  buttons?.[next === "rrf" ? 0 : 1]?.focus();
                }
              }}
              className="relative px-2.5 py-1 text-[12px] font-medium"
            >
              {active && (
                <motion.span
                  layoutId={`${instanceId}-fusion-pill`}
                  className="absolute inset-0 rounded-[7px] bg-amber/[0.14] ring-1 ring-inset ring-amber-dim"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              <span className={`relative telemetry uppercase tracking-wide ${active ? "text-amber-hi" : "text-ink-3"}`}>
                {opt === "rrf" ? "RRF" : "Weighted"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeightSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const lexPct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="telemetry text-[11px] text-amber">lex {lexPct}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={lexPct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label="Lexical to semantic weight balance"
        aria-valuetext={`Lexical ${lexPct}%, semantic ${100 - lexPct}%`}
        className="cine-slider h-1.5 w-28 appearance-none rounded-chip"
        style={{ background: `linear-gradient(90deg, var(--amber) 0%, var(--amber) ${lexPct}%, var(--steel) ${lexPct}%, var(--steel) 100%)` }}
      />
      <span className="telemetry text-[11px] text-steel">sem {100 - lexPct}</span>
    </div>
  );
}

function RerankSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <span className="label-eyebrow">Rerank</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Toggle cross-encoder rerank"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-chip border transition-colors duration-200 ${
          value ? "border-amber-dim bg-amber/[0.18]" : "border-line bg-black/30"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 620, damping: 34 }}
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full ${
            value ? "left-[18px] bg-amber" : "left-[3px] bg-ink-3"
          }`}
        />
      </button>
    </label>
  );
}
