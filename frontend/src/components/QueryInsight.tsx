import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { EngineInfo, ParsedQuery, Timing } from "../lib/types";
import { formatMs, shortModel } from "../lib/format";
import { LayersIcon, SparkIcon, WandIcon } from "./icons";

const EASE = [0.16, 1, 0.3, 1] as const;
const container = { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 520, damping: 30 } },
};
const INTENT_LABEL: Record<ParsedQuery["intent"], string> = {
  recommend: "recommend", find_title: "find title", similar: "similar",
};

export function QueryInsight({
  parsed, engine, timing,
}: {
  parsed: ParsedQuery;
  engine: EngineInfo;
  timing: Timing;
}) {
  const reducedMotion = useReducedMotion();
  const chipVariants = reducedMotion ? undefined : item;
  const era = parsed.era_from || parsed.era_to
    ? `${parsed.era_from ?? "…"}–${parsed.era_to ?? "…"}` : null;
  return (
    <motion.section
      variants={reducedMotion ? undefined : container}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      aria-label="How the engine understood your query"
      className="surface rounded-card p-4 shadow-card"
    >
      <div className="mb-3 flex items-center gap-2">
        <WandIcon size={15} className="text-amber" />
        <span className="label-eyebrow !text-ink-2">Query understanding</span>
      </div>
      <motion.div className="flex flex-wrap items-center gap-2">
        <motion.span variants={chipVariants}>
          <Chip tone="amber"><SparkIcon size={12} />{INTENT_LABEL[parsed.intent]}</Chip>
        </motion.span>
        {parsed.similar_to && (
          <motion.span variants={chipVariants}><Chip>like <span className="text-ink">{parsed.similar_to}</span></Chip></motion.span>
        )}
        {parsed.genres.map((genre) => <motion.span key={`g-${genre}`} variants={chipVariants}><Chip>{genre}</Chip></motion.span>)}
        {parsed.moods.map((mood) => <motion.span key={`m-${mood}`} variants={chipVariants}><Chip tone="steel">{mood}</Chip></motion.span>)}
        {era && <motion.span variants={chipVariants}><Chip><span className="telemetry">{era}</span></Chip></motion.span>}
        {parsed.min_rating != null && (
          <motion.span variants={chipVariants}><Chip>rating ≥ <span className="telemetry">{parsed.min_rating}</span></Chip></motion.span>
        )}
        {parsed.negations.map((negation) => (
          <motion.span key={`n-${negation}`} variants={chipVariants}>
            <span className="chip !border-danger/40 !text-danger line-through decoration-danger/70">{negation}</span>
          </motion.span>
        ))}
      </motion.div>
      <div className="hairline my-3" />
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.2, duration: 0.5, ease: EASE }}
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        <span className="inline-flex items-center gap-1.5 text-ink-3">
          <LayersIcon size={13} className="text-ink-3" />
          <span className="telemetry text-[11px] text-ink-2">{engine.fusion.toUpperCase()}</span>
        </span>
        <Divider />
        <TelemetryStat label="rerank" value={engine.rerank ? "on" : "off"} on={engine.rerank} />
        <Divider />
        <span className="telemetry text-[11px] text-ink-3">embed <span className="text-amber-hi">{shortModel(engine.embedding_model)}</span></span>
        {engine.reranker_model && (
          <>
            <Divider />
            <span className="telemetry text-[11px] text-ink-3">rerank <span className="text-steel">{shortModel(engine.reranker_model)}</span></span>
          </>
        )}
        <Divider />
        <span className="telemetry text-[11px] text-ink-3">total <span className="text-ink">{formatMs(timing.total)}</span>ms</span>
      </motion.div>
    </motion.section>
  );
}

function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "amber" | "steel" }) {
  const toneClass = tone === "amber"
    ? "!border-amber-dim/60 !text-amber-hi !bg-amber/[0.06]"
    : tone === "steel" ? "!border-steel-dim !text-steel !bg-steel/[0.06]" : "";
  return <span className={`chip ${toneClass}`}>{children}</span>;
}

function TelemetryStat({ label, value, on }: { label: string; value: string; on?: boolean }) {
  return <span className="telemetry text-[11px] text-ink-3">{label}{" "}<span className={on ? "text-good" : "text-ink-3"}>{value}</span></span>;
}

function Divider() {
  return <span className="h-3 w-px bg-line-strong" aria-hidden="true" />;
}
