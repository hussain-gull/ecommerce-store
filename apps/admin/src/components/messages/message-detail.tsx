import React from "react";
import type { ContactMessage } from "@ecommerce/contracts";
import {
  MailIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  TagIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { DetailField } from "@/components/detail-field";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/utils";

export function MessageDetail({
  message,
  open,
  onOpenChange,
}: {
  message: ContactMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent
        style={{ "--drawer-content-width": "500px" } as React.CSSProperties}
      >
        {message && (
          <>
            <DrawerHeader className="gap-1">
              <div className="flex items-center justify-between gap-3">
                <DrawerTitle>Messages</DrawerTitle>
                {message.status === "new" ? (
                  <Badge variant="default">New</Badge>
                ) : (
                  <Badge variant="secondary">
                    <MailIcon className="size-3" />
                    Read
                  </Badge>
                )}
              </div>
              <DrawerDescription>{message.subject}</DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
              <Separator className="mt-2" />

              <div className="grid grid-cols-2 gap-4">
                <DetailField icon={UserIcon} label="Name">
                  {message.name}
                </DetailField>

                <DetailField icon={MailIcon} label="Email">
                  <a
                    href={`mailto:${message.email}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {message.email}
                  </a>
                </DetailField>

                {message.phone && (
                  <DetailField icon={PhoneIcon} label="Phone">
                    <a
                      href={`tel:${message.phone}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {message.phone}
                    </a>
                  </DetailField>
                )}

                <DetailField icon={ClockIcon} label="Received">
                  {formatDate(message.createdAt)}
                </DetailField>
              </div>

              <Separator />

              <DetailField icon={TagIcon} label="Subject">
                {message.subject}
              </DetailField>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Message
                </span>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {message.message}
                </p>
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={() => {
                  window.location.href = `mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`;
                }}
              >
                Reply via Email
              </Button>
              <DrawerClose render={<Button variant="outline" />}>
                Close
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
