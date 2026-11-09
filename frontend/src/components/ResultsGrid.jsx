import { motion } from 'framer-motion';
import { MovieCard } from './MovieCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/**
 * Responsive results grid: 2 cols mobile, 3 tablet, 4 desktop, 5 xl.
 * Staggered entrance; re-keying on query drives the layout re-animation.
 *
 * @param {{
 *   results: import('@/lib/types').SearchResult[],
 *   onOpen: (result: import('@/lib/types').SearchResult) => void,
 *   onSimilar: (id: string) => void,
 * }} props
 */
export function ResultsGrid({ results, onOpen, onSimilar }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {results.map((result, i) => (
        <MovieCard
          key={result.id}
          result={result}
          rank={i + 1}
          index={i}
          onOpen={onOpen}
          onSimilar={onSimilar}
        />
      ))}
    </motion.div>
  );
}

