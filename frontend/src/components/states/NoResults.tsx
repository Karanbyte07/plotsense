import { motion, useReducedMotion } from "framer-motion";
import { SearchIcon } from "../icons";

export function NoResults({
  query, samples, onPickQuery,
}: {
  query: string;
  samples: string[];
  onPickQuery: (query: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-lg text-center"
    >
      <div className="surface mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full shadow-card">
        <SearchIcon size={24} className="text-ink-3" />
      </div>
      <h2 className="font-display text-lg font-semibold text-ink">Nothing surfaced for “{query}”</h2>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
        Try broadening the terms, dropping a constraint, or leaning on mood and genre rather than exact titles.
      </p>
      {samples.length > 0 && (
        <div className="mt-6">
          <span className="label-eyebrow">Try one of these</span>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {samples.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => onPickQuery(sample)}
                className="chip cursor-pointer transition-colors duration-200 hover:border-amber-dim hover:!text-amber-hi"
              >{sample}</button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
