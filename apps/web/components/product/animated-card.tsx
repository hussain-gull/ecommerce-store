"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ProductCard } from "./product-card";
import type { Product } from "@ecommerce/contracts";

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: delay * 0.08 },
  }),
};

export function AnimatedCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      custom={index % 4}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <ProductCard product={product} priority={index < 4} />
    </motion.div>
  );
}
