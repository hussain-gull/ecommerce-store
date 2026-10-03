"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Phone, Upload } from "lucide-react";
import { usePaymentContent } from "@/lib/hooks/use-payment-content";
import { useToastStore } from "@/lib/store/toast.store";

const MAX_BYTES = 8 * 1024 * 1024;

type JazzCashPaymentProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  labelCls: string;
};

export function JazzCashPayment({
  file,
  onFileChange,
  labelCls,
}: JazzCashPaymentProps) {
  const pushToast = useToastStore((s) => s.push);
  const { data: pay, isLoading, isError } = usePaymentContent();
  const [preview, setPreview] = useState<string | null>(null);

  // Object URL for the thumbnail; revoked when the file changes/unmounts.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function copyNumber() {
    try {
      if (!pay) return;
      await navigator.clipboard.writeText(pay.accountNumber);
      pushToast("success", "Account number copied");
    } catch {
      pushToast("error", "Couldn't copy — please copy it manually");
    }
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.type.startsWith("image/")) {
      pushToast("error", "Please choose an image file");
      return;
    }
    if (f && f.size > MAX_BYTES) {
      pushToast("error", "Screenshot must be 8MB or smaller");
      return;
    }
    onFileChange(f);
  }

  return (
    <div className="p-5 space-y-5">
      <p className="text-[12px] text-secondary bg-wash px-3 py-2 border border-line">
        Scan the QR code with JazzCash (or send to the account below), pay the
        order total, then upload the payment screenshot. We verify it before
        confirming your order.
      </p>

      {isLoading ? (
        <p className="text-[12px] text-secondary">Loading payment details…</p>
      ) : isError || !pay ? (
        <p className="text-[12px] text-accent" role="alert">
          Couldn&apos;t load the payment details. Please refresh the page.
        </p>
      ) : !pay.accountNumber ? (
        <p className="text-[12px] text-accent" role="alert">
          Online payment isn&apos;t available right now. Please check back soon.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {pay.qrImage && (
            <div className="relative w-48 h-48 bg-white border border-line shrink-0">
              <Image
                src={pay.qrImage}
                alt="JazzCash QR code"
                fill
                sizes="192px"
                className="object-contain p-2"
                unoptimized
              />
            </div>
          )}

          <dl className="text-[13px] space-y-3 min-w-0">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                Account name
              </dt>
              <dd className="text-secondary m-0">{pay.accountName}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                JazzCash account number
              </dt>
              <dd className="m-0 flex items-center gap-2">
                <span className="text-foreground font-semibold break-all">
                  {pay.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={copyNumber}
                  aria-label="Copy account number"
                  className="shrink-0 inline-flex items-center gap-1 h-7 px-2 border border-line bg-white text-[10px] font-bold uppercase tracking-widest text-foreground cursor-pointer hover:border-accent hover:text-accent transition-colors"
                >
                  <Copy size={12} /> Copy
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                Need help?
              </dt>
              <dd className="text-secondary m-0 flex items-center gap-1.5">
                <Phone size={12} /> {pay.supportPhone}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div>
        <label htmlFor="pay-proof" className={labelCls}>
          Payment screenshot *
        </label>
        <label
          htmlFor="pay-proof"
          className="flex items-center gap-3 border border-dashed border-line bg-white px-4 py-4 cursor-pointer hover:border-accent transition-colors"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Payment screenshot preview"
              className="w-16 h-16 object-cover border border-line"
            />
          ) : (
            <Upload size={20} className="text-muted shrink-0" />
          )}
          <span className="text-[12px] text-secondary min-w-0 truncate">
            {file
              ? file.name
              : "Upload the screenshot of your JazzCash payment"}
          </span>
        </label>
        <input
          id="pay-proof"
          type="file"
          accept="image/*"
          onChange={pick}
          className="sr-only"
        />
      </div>
    </div>
  );
}
