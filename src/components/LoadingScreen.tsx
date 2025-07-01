import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const letters = "RYANTANG".split("");

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.2,
    },
  },
};

const letterVariants = {
  initial: {
    y: 60,
    opacity: 0,
    scale: 0.8,
    rotate: -10,
    filter: "blur(8px)",
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 700,
      damping: 30,
    },
  },
};

export default function LoadingScreen({ show = true }: { show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white text-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="flex gap-2 md:gap-4 text-5xl md:text-7xl font-extrabold tracking-widest"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {letters.map((char, i) => (
              <motion.span
                key={char + i}
                variants={letterVariants}
                className="inline-block"
                style={{
                  textShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  letterSpacing: "0.1em",
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 