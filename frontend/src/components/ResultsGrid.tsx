import { motion, useReducedMotion } from "framer-motion";
import type { SearchResult } from "../lib/types";
import { MovieCard } from "./MovieCard";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

export function ResultsGrid({
  results, onSimilar,
}: {
  results: SearchResult[];
  onSimilar: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      variants={reducedMotion ? undefined : container}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {results.map((result, index) => (
        <MovieCard key={result.id} result={result} rank={index + 1} index={index} onSimilar={onSimilar} />
      ))}
    </motion.div>
  );
}
