import { motion, useReducedMotion } from "framer-motion";
import { Atmosphere } from "./components/Atmosphere";
import { Wordmark } from "./components/Wordmark";

const EASE = [0.16, 1, 0.3, 1] as const;

function App() {
  const reducedMotion = useReducedMotion();

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
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

export default App;
