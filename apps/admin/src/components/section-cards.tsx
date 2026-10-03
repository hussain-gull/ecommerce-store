"use client";

import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <StatCard
        description="Total Revenue"
        value="$1,250.00"
        badge={
          <>
            <TrendingUpIcon />
            +12.5%
          </>
        }
        footerHeadline={
          <>
            Trending up this month <TrendingUpIcon className="size-4" />
          </>
        }
        footerSub="Visitors for the last 6 months"
      />
      <StatCard
        description="New Customers"
        value="1,234"
        badge={
          <>
            <TrendingDownIcon />
            -20%
          </>
        }
        footerHeadline={
          <>
            Down 20% this period <TrendingDownIcon className="size-4" />
          </>
        }
        footerSub="Acquisition needs attention"
      />
      <StatCard
        description="Active Accounts"
        value="45,678"
        badge={
          <>
            <TrendingUpIcon />
            +12.5%
          </>
        }
        footerHeadline={
          <>
            Strong user retention <TrendingUpIcon className="size-4" />
          </>
        }
        footerSub="Engagement exceed targets"
      />
      <StatCard
        description="Growth Rate"
        value="4.5%"
        badge={
          <>
            <TrendingUpIcon />
            +4.5%
          </>
        }
        footerHeadline={
          <>
            Steady performance increase <TrendingUpIcon className="size-4" />
          </>
        }
        footerSub="Meets growth projections"
      />
    </div>
  );
}
