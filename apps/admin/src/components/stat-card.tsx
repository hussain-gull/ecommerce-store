import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface StatCardProps {
  description: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  footerHeadline?: React.ReactNode;
  footerSub?: React.ReactNode;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
}

export function StatCard({
  description,
  value,
  badge,
  badgeVariant = "outline",
  footerHeadline,
  footerSub,
}: StatCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {badge !== undefined && (
          <CardAction>
            <Badge variant={badgeVariant}>{badge}</Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footerHeadline || footerSub) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footerHeadline && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerHeadline}
            </div>
          )}
          {footerSub && (
            <div className="text-muted-foreground">{footerSub}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
