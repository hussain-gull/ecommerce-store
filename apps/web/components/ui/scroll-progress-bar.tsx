"use client";

import { useScroll, useSpring, motion } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-0.75 bg-accent-dark origin-left z-9999"
    />
  );
}
