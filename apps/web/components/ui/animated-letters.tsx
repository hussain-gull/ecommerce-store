"use client";

import { motion, type Variants } from "framer-motion";

const letter: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.028, duration: 0.28, ease: "easeOut" },
  }),
};

export function AnimatedLetters({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letter}
          initial="hidden"
          animate="visible"
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </>
  );
}
