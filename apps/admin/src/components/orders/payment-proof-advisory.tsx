import { CheckCircle2Icon, Loader2Icon, MinusCircleIcon } from "lucide-react";
import type { AdminOrder } from "@ecommerce/contracts";
import { Badge } from "@/components/ui/badge";
import { usePaymentContent } from "@/lib/hooks/use-content";
import { usePaymentProofAnalysis } from "@/lib/hooks/use-payment-proof-analysis";

// Advisory only: hints read from the screenshot by OCR. The admin still
// verifies the payment in their JazzCash app and decides whether to confirm.
export function PaymentProofAdvisory({ order }: { order: AdminOrder }) {
  const { data: pay } = usePaymentContent();
  const {
    data: analysis,
    isLoading,
    isError,
  } = usePaymentProofAnalysis(
    order.id,
    order.paymentScreenshotUrl,
    pay && {
      total: order.totalPrice,
      accountNumber: pay.accountNumber,
      submittedAt: order.paymentSubmittedAt,
    },
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Automated screenshot check
        </span>
        <Badge variant="secondary">Advisory only</Badge>
      </div>

      {isLoading || !pay ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Reading screenshot…
        </p>
      ) : isError || !analysis ? (
        <p className="text-muted-foreground">
          Couldn&apos;t read this screenshot automatically. Check it by eye.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-background p-2.5 text-xs">
            <Detail label="Amount read" value={analysis.details.amount} />
            <Detail
              label="Transaction ID"
              value={analysis.details.transactionId}
              mono
            />
            <Detail label="Date & time" value={analysis.details.dateTime} />
            <Detail
              label="Numbers on receipt"
              value={analysis.details.numbers.join(", ") || undefined}
              mono
            />
          </dl>
          <ul className="flex flex-col gap-1.5">
            {analysis.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {c.status === "found" ? (
                  <CheckCircle2Icon className="size-4 shrink-0 text-green-600" />
                ) : (
                  <MinusCircleIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  {c.label}
                  {c.detail && (
                    <span className="ml-1 font-mono text-xs">({c.detail})</span>
                  )}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.status === "found" ? "found" : "not found"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        &quot;Not found&quot; doesn&apos;t mean the payment is fake — OCR can
        miss text. Always confirm the payment in your JazzCash app before
        approving.
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>
        {value ?? <span className="text-muted-foreground">not read</span>}
      </dd>
    </>
  );
}
