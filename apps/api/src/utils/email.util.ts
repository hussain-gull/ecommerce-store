import { Resend } from "resend";
import { config } from "../config.js";
import {
  buildWelcomeEmailHtml,
  buildWelcomeEmailText,
} from "../emails/welcome.email.js";
import {
  buildResetEmailHtml,
  buildResetEmailText,
} from "../emails/forgot-password.email.js";

import {
  buildPaymentReceivedEmailHtml,
  buildPaymentReceivedEmailText,
  buildOrderAcceptedEmailHtml,
  buildOrderAcceptedEmailText,
} from "../emails/order.email.js";
import { branding } from "@ecommerce/contracts";

// ── Resend client singleton ───────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) _resend = new Resend(config.resendApiKey);
  return _resend;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type WelcomeEmailOptions = {
  to: string;
  firstName: string;
};

type ResetEmailOptions = {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresAt: Date;
};

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  opts: WelcomeEmailOptions,
): Promise<void> {
  const { to, firstName } = opts;
  const subject = `Welcome to ${branding.storeName}, ${firstName}!`;

  if (!config.resendEnabled) {
    console.log(
      [
        "",
        "┌─────────────────────────────────────────────────────────────┐",
        `│          ${branding.storeName} — WELCOME EMAIL (DEV)              │`,
        "├─────────────────────────────────────────────────────────────┤",
        `│  To      : ${to}`,
        `│  Subject : ${subject}`,
        "└─────────────────────────────────────────────────────────────┘",
        "",
      ].join("\n"),
    );
    return;
  }

  const { error } = await getResend().emails.send({
    from: config.emailFrom,
    to,
    subject,
    html: buildWelcomeEmailHtml(firstName),
    text: buildWelcomeEmailText(firstName),
  });

  if (error) {
    throw new Error(`Welcome email delivery failed: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  opts: ResetEmailOptions,
): Promise<void> {
  const { to, firstName, resetUrl, expiresAt } = opts;

  const expiresFormatted = expiresAt.toLocaleString("en-PK", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "Asia/Karachi",
  });

  const subject = `Reset your ${branding.storeName} password`;

  if (!config.resendEnabled) {
    console.log(
      [
        "",
        "┌─────────────────────────────────────────────────────────────┐",
        `│          ${branding.storeName} — PASSWORD RESET EMAIL (DEV)       │`,
        "├─────────────────────────────────────────────────────────────┤",
        `│  To      : ${to}`,
        `│  Subject : ${subject}`,
        `│  Expires : ${expiresFormatted}`,
        "├─────────────────────────────────────────────────────────────┤",
        "│  RESET URL:",
        `│  ${resetUrl}`,
        "└─────────────────────────────────────────────────────────────┘",
        "",
      ].join("\n"),
    );
    return;
  }

  const { error } = await getResend().emails.send({
    from: config.emailFrom,
    to,
    subject,
    html: buildResetEmailHtml(firstName, to, resetUrl, expiresFormatted),
    text: buildResetEmailText(firstName, to, resetUrl, expiresFormatted),
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

// ── Order emails ──────────────────────────────────────────────────────────────

type OrderEmailOptions = {
  to: string;
  firstName: string;
  orderId: string;
  total: string;
  supportPhone: string;
};

async function deliver(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (!config.resendEnabled) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    return;
  }
  const { error } = await getResend().emails.send({
    from: config.emailFrom,
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Email delivery failed: ${error.message}`);
}

export function sendPaymentReceivedEmail(o: OrderEmailOptions): Promise<void> {
  return deliver(
    o.to,
    "We received your payment — verifying",
    buildPaymentReceivedEmailHtml(o),
    buildPaymentReceivedEmailText(o),
  );
}

export function sendOrderAcceptedEmail(o: OrderEmailOptions): Promise<void> {
  return deliver(
    o.to,
    `Your ${branding.storeName} order is accepted`,
    buildOrderAcceptedEmailHtml(o),
    buildOrderAcceptedEmailText(o),
  );
}
