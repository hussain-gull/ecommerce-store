"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ProductDetail,
  ConditionGuideContent,
} from "@ecommerce/contracts";
import { StoreReviews } from "./store-reviews";

const TAB_LABELS = ["Description", "Condition Guide", "Store Reviews"] as const;
type TabLabel = (typeof TAB_LABELS)[number];

type ProductTabsProps = Pick<ProductDetail, "description"> & {
  conditionGuide?: ConditionGuideContent | null;
};

export function ProductTabs({ description, conditionGuide }: ProductTabsProps) {
  const [active, setActive] = useState<TabLabel>("Description");

  return (
    <div>
      <div className="border-b-2 border-line mb-8 flex" role="tablist">
        {TAB_LABELS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            role="tab"
            aria-selected={active === t}
            className={`bg-transparent border-none cursor-pointer text-sm font-bold tracking-widest uppercase px-7 py-3.5 -mb-0.5 transition-colors border-b-2 ${active === t ? "text-accent border-accent" : "text-foreground border-transparent hover:text-accent"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-secondary leading-[1.8] mb-16"
        >
          {active === "Description" && (
            <div>
              <p>{description}</p>
            </div>
          )}
          {active === "Condition Guide" && (
            <div>
              {conditionGuide && conditionGuide.items.length > 0 ? (
                <dl className="flex flex-col gap-4">
                  {conditionGuide.items.map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs font-bold tracking-widest uppercase text-foreground">
                        {item.label}
                      </dt>
                      <dd className="text-sm text-secondary leading-[1.8]">
                        {item.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>No condition guide available.</p>
              )}
            </div>
          )}
          {active === "Store Reviews" && <StoreReviews />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
