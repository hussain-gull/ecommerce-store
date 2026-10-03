import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentContentSchema,
  PAYMENT_CONTENT_LIMITS,
  type PaymentContent,
} from "@ecommerce/contracts";
import { Loader2Icon, SaveIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadMediaApi } from "@/lib/api/media.api";
import {
  usePaymentContent,
  useUpdatePaymentContent,
} from "@/lib/hooks/use-content";
import { useToastStore } from "@/lib/store/toast.store";
import type { AdminRoute } from "@/lib/routes";

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function PaymentEditor({ content }: { content: PaymentContent }) {
  const { mutate: save, isPending } = useUpdatePaymentContent();
  const push = useToastStore((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<PaymentContent>({
    resolver: zodResolver(paymentContentSchema),
    defaultValues: content,
  });
  const qrImage = watch("qrImage");

  async function onPickQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadMediaApi(file, "payment-qr");
      setValue("qrImage", url, { shouldDirty: true });
      push("success", "QR uploaded — click Save changes to publish it.");
    } catch (err) {
      push("error", (err as { message?: string })?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit((v) => save(v))}
      className="flex flex-col gap-6 px-4 py-4 lg:px-6 md:py-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>JazzCash account</CardTitle>
          <CardDescription>
            Shown to customers on the checkout page. The support phone is also
            used in order emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.accountName}>
              <FieldLabel htmlFor="account-name">Account name</FieldLabel>
              <Input
                id="account-name"
                maxLength={PAYMENT_CONTENT_LIMITS.accountName}
                {...register("accountName")}
              />
              <FieldError errors={fieldErrors(errors.accountName?.message)} />
            </Field>
            <Field data-invalid={!!errors.accountNumber}>
              <FieldLabel htmlFor="account-number">Account number</FieldLabel>
              <Input
                id="account-number"
                maxLength={PAYMENT_CONTENT_LIMITS.accountNumber}
                {...register("accountNumber")}
              />
              <FieldError errors={fieldErrors(errors.accountNumber?.message)} />
            </Field>
            <Field data-invalid={!!errors.supportPhone}>
              <FieldLabel htmlFor="support-phone">Support phone</FieldLabel>
              <Input
                id="support-phone"
                maxLength={PAYMENT_CONTENT_LIMITS.supportPhone}
                {...register("supportPhone")}
              />
              <FieldError errors={fieldErrors(errors.supportPhone?.message)} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR code</CardTitle>
          <CardDescription>
            Upload the JazzCash QR customers scan to pay.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          {qrImage ? (
            <img
              src={qrImage}
              alt="JazzCash QR code"
              className="size-40 rounded-md border object-contain"
            />
          ) : (
            <div className="flex size-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
              No QR uploaded
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPickQr}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadIcon />
              )}
              {qrImage ? "Replace QR" : "Upload QR"}
            </Button>
            {qrImage && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setValue("qrImage", "", { shouldDirty: true })}
              >
                <Trash2Icon />
                Remove
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        {isDirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button type="submit" disabled={isPending || uploading || !isDirty}>
          {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = usePaymentContent();

  return (
    <AdminLayout
      title="Payment Details"
      activeRoute="payment"
      onNavigate={onNavigate}
    >
      {isLoading && (
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:py-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <p className="px-4 py-6 text-sm text-destructive lg:px-6">
          Failed to load payment details.
        </p>
      )}
      {data && <PaymentEditor content={data} />}
    </AdminLayout>
  );
}
