"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ApiErrorBody, ApiFieldError } from "@ecommerce/contracts";
import {
  contactMessageSchema,
  type ContactMessageFormValues,
} from "@ecommerce/contracts";
import { useSendContactMessage } from "@/lib/hooks/use-contact";
import { FormInput } from "@/components/ui/form-input";

const MAX = { email: 50, subject: 100, message: 3000 } as const;

export function ContactForm() {
  const [success, setSuccess] = useState(false);
  const { mutate: sendMessage, isPending } = useSendContactMessage();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<ContactMessageFormValues>({
    resolver: zodResolver(contactMessageSchema),
  });

  const emailLength: number = watch("email")?.length ?? 0;
  const subjectLength: number = watch("subject")?.length ?? 0;
  const messageLength: number = watch("message")?.length ?? 0;

  function onSubmit(values: ContactMessageFormValues) {
    sendMessage(values, {
      onSuccess: () => {
        setSuccess(true);
        reset();
      },
      onError: (err: ApiErrorBody) => {
        const apiErr = err as ApiErrorBody;
        const fieldNames: (keyof ContactMessageFormValues)[] = [
          "name",
          "phone",
          "email",
          "subject",
          "message",
        ];
        apiErr.errors?.forEach(({ field, message }: ApiFieldError) => {
          const matched = fieldNames.find((f) => f === field);
          if (matched) {
            setError(matched, { message });
          } else {
            setError("root.server", { message: apiErr.message });
          }
        });
        if (!apiErr.errors?.length) {
          setError("root.server", {
            message: apiErr.message ?? "Failed to send message.",
          });
        }
      },
    });
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-14 bg-surface border border-line"
      >
        <CheckCircle2
          size={48}
          className="text-accent mx-auto mb-4"
          strokeWidth={1.5}
        />
        <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest mb-2">
          Message Sent!
        </h3>
        <p className="text-[13px] text-secondary">
          Thank you for reaching out. We'll get back to you within 24 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {errors.root?.server && (
        <p
          role="alert"
          className="text-accent text-[13px] bg-accent/10 px-3 py-2.5 border border-accent/20 font-semibold"
        >
          {errors.root.server.message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormInput
          id="cf-name"
          label="Full Name"
          required
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          maxLength={100}
          error={errors.name?.message}
          {...register("name")}
        />

        <FormInput
          id="cf-phone"
          label="Phone Number"
          required
          type="tel"
          autoComplete="tel"
          placeholder="03XXXXXXXXX"
          maxLength={20}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <FormInput
          id="cf-email"
          label="Email Address"
          required
          type="email"
          autoComplete="email"
          placeholder="john@example.com"
          maxLength={MAX.email}
          rightLabel={`${emailLength}/${MAX.email}`}
          error={errors.email?.message}
          {...register("email")}
        />

        <FormInput
          id="cf-subject"
          label="Subject"
          required
          type="text"
          placeholder="How can we help?"
          maxLength={MAX.subject}
          rightLabel={`${subjectLength}/${MAX.subject}`}
          error={errors.subject?.message}
          {...register("subject")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="cf-message"
            className="text-xs font-bold tracking-widest uppercase text-foreground"
          >
            Message{" "}
            <span className="text-accent ml-1" aria-hidden>
              *
            </span>
          </label>
          <span className="text-[11px]">
            {messageLength}/{MAX.message}
          </span>
        </div>
        <textarea
          id="cf-message"
          rows={6}
          placeholder="Type your message here…"
          maxLength={MAX.message}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
          className={`w-full border bg-white px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors resize-y ${errors.message ? "border-accent" : "border-line"}`}
          {...register("message")}
        />
        <AnimatePresence>
          {errors.message?.message && (
            <motion.p
              id="cf-message-error"
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[12px] font-semibold text-accent"
            >
              {errors.message.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 px-8 bg-foreground text-wash border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
