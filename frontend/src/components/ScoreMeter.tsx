import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useId, useState } from "react";
import type { ScoreBreakdown } from "../lib/types";
import { toPercent } from "../lib/format";

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;
const TOOLTIP = "Hybrid score — BM25+ lexical fused with dense semantic, cross-encoder reranked.";

export function ScoreMeter({
  score, scores, delay = 0,
}: {
  score: number;
  scores: ScoreBreakdown;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const pct = toPercent(score);
  const count = useMotionValue(reducedMotion ? pct : 0);
  const rounded = useTransform(count, (value) => Math.round(value));
  const dashOffset = useTransform(count, (value) => RING_C - (value / 100) * RING_C);
  const [display, setDisplay] = useState(reducedMotion ? pct : 0);

  useEffect(() => {
    if (reducedMotion) {
      count.set(pct);
      setDisplay(pct);
      return;
    }
    const unsubscribe = rounded.on("change", setDisplay);
    const animation = animate(count, pct, { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] });
    return () => { animation.stop(); unsubscribe(); };
  }, [pct, delay, count, rounded, reducedMotion]);

  return (
    <div className="flex items-center gap-3">
      <ScoreRing pct={pct} dashOffset={dashOffset} display={display} />
      <div className="flex-1 space-y-2">
        <ScoreBar label="Lexical" value={scores.lexical} rank={scores.lexical_rank} color="var(--amber)" delay={delay} />
        <ScoreBar label="Semantic" value={scores.semantic} rank={scores.semantic_rank} color="var(--steel)" delay={delay + 0.08} />
      </div>
    </div>
  );
}

function ScoreRing({
  pct, dashOffset, display,
}: {
  pct: number;
  dashOffset: MotionValue<number>;
  display: number;
}) {
  const tooltipId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused || pinned);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => { setHovered(true); setDismissed(false); }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={`Hybrid match score ${pct} percent`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onFocus={() => { setFocused(true); setDismissed(false); }}
        onBlur={() => { setFocused(false); setPinned(false); setDismissed(false); }}
        onClick={() => {
          if (pinned) { setPinned(false); setDismissed(true); }
          else { setPinned(true); setDismissed(false); }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setPinned(false);
            setDismissed(true);
          }
        }}
        className="block rounded-full focus-visible:outline-amber"
      >
        <svg width={52} height={52} viewBox="0 0 52 52" aria-hidden="true" className="-rotate-90">
          <circle cx="26" cy="26" r={RING_R} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
          <motion.circle
            cx="26" cy="26" r={RING_R} fill="none" stroke="var(--amber)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray={RING_C}
            style={{ strokeDashoffset: dashOffset, filter: "drop-shadow(0 0 4px rgba(245,184,65,0.5))" }}
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="telemetry text-[15px] font-semibold text-amber-hi">{display}</span>
        </span>
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="surface absolute bottom-full left-0 z-30 mb-2 w-52 rounded-btn p-3 text-[11px] leading-relaxed text-ink-2 shadow-panel"
          style={{ maxWidth: "calc((100vw - 3rem) / 2 - 1.5rem)" }}
        >
          {TOOLTIP}
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label, value, rank, color, delay,
}: {
  label: string;
  value: number;
  rank: number | null;
  color: string;
  delay: number;
}) {
  const reducedMotion = useReducedMotion();
  const scaleX = toPercent(value) / 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</span>
        <span className="telemetry text-[11px]" style={{ color }}>
          {value.toFixed(3)}
          {rank != null && <span className="ml-1 text-ink-3">#{rank}</span>}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-chip bg-line-strong">
        <motion.div
          initial={reducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX }}
          viewport={{ once: true }}
          transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full origin-left rounded-chip"
          style={{ background: color, scaleX: reducedMotion ? scaleX : undefined }}
        />
      </div>
    </div>
  );
}
