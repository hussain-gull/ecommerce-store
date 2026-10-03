import { InboxIcon, CircleDotIcon, CheckCircleIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

export function MessageStats({
  total,
  unread,
  read,
}: {
  total: number;
  unread: number;
  read: number;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t
            *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs
             lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card"
    >
      <StatCard
        description="Total Messages"
        value={total}
        badge={
          <>
            <InboxIcon className="size-3" />
            All time
          </>
        }
        footerHeadline="Inbox overview"
        footerSub="All contact form submissions"
      />
      <StatCard
        description="Unread"
        value={unread}
        badgeVariant={unread > 0 ? "default" : "outline"}
        badge={
          <>
            <CircleDotIcon className="size-3" />
            {unread > 0 ? "Needs attention" : "All clear"}
          </>
        }
        footerHeadline={
          unread > 0
            ? `${unread} 
                message${unread === 1 ? "" : "s"} awaiting review`
            : "No unread messages"
        }
        footerSub="Click a row to open"
      />
      <StatCard
        description="Read"
        value={read}
        badge={
          <>
            <CheckCircleIcon className="size-3" />
            Reviewed
          </>
        }
        footerHeadline="Messages opened"
        footerSub={
          total > 0
            ? `${Math.round((read / total) * 100)}% read rate`
            : "No messages yet"
        }
      />
    </div>
  );
}

export function MessageStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}
