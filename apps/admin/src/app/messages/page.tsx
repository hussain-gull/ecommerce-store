import React, { useState } from "react";
import type { ContactMessage } from "@ecommerce/contracts";
import { AdminLayout } from "@/components/admin-layout";
import { MessagesTable } from "@/components/messages/messages-table";
import { MessageDetail } from "@/components/messages/message-detail";
import { MessageStats, MessageStatsSkeleton } from "./message-stats";
import { useMarkMessageRead, useMessageCounts } from "@/lib/hooks/use-messages";
import type { AdminRoute } from "@/lib/routes";

export default function MessagesPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}): React.ReactElement {
  const { data: counts, isLoading } = useMessageCounts();
  const { mutate: markRead } = useMarkMessageRead();
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  function openMessage(msg: ContactMessage) {
    setSelected(msg);
    if (msg.status === "new") markRead(msg.id);
  }

  return (
    <AdminLayout
      title="Messages"
      activeRoute="messages"
      onNavigate={onNavigate}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {isLoading || !counts ? (
              <MessageStatsSkeleton />
            ) : (
              <MessageStats
                total={counts.all}
                unread={counts.new}
                read={counts.read}
              />
            )}
            <MessagesTable onOpen={openMessage} />
          </div>
        </div>
      </div>

      <MessageDetail
        message={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </AdminLayout>
  );
}
