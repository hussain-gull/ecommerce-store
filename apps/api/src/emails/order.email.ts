import { config } from "../config.js";
import { branding } from "@ecommerce/contracts";

type OrderEmailInput = {
  firstName: string;
  orderId: string;
  /** Grand total, already formatted with the currency (formatMoney). */
  total: string;
  /** Support phone, from the admin-editable payment details. */
  supportPhone: string;
};

const esc = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

// One shared shell so both order emails match the welcome/reset look.
function layout(
  supportPhone: string,
  title: string,
  heading: string,
  lines: string[],
  ctaLabel: string,
  ctaUrl: string,
): string {
  const year = new Date().getFullYear();
  const paras = lines
    .map(
      (l) =>
        `<p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.75;">${l}</p>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;">
        <tr><td style="background-color:#1a1a1a;padding:28px 40px;">
          <p style="margin:0;font-size:18px;font-weight:800;letter-spacing:5px;text-transform:uppercase;color:#ffffff;">${branding.storeName}</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 20px;font-size:24px;color:#141414;">${esc(heading)}</h1>
          ${paras}
          <a href="${esc(ctaUrl)}" style="display:inline-block;margin-top:8px;padding:14px 28px;background-color:#141414;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${esc(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:20px 40px;background-color:#fafafa;">
          <p style="margin:0;font-size:11px;color:#888888;line-height:1.6;">© ${year} ${branding.storeName}. Questions? Call ${esc(supportPhone)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Payment screenshot received — we're verifying it ─────────────────────────

export function buildPaymentReceivedEmailHtml(i: OrderEmailInput): string {
  return layout(
    i.supportPhone,
    "We received your payment proof",
    "Payment received — verifying",
    [
      `Hi ${esc(i.firstName)}, thank you for your order <strong>#${esc(i.orderId.slice(-8))}</strong>.`,
      `We received your JazzCash payment screenshot for <strong>${esc(i.total)}</strong> and we are verifying it. You will get another email as soon as your order is accepted.`,
      `If you have any questions, contact us on <strong>${esc(i.supportPhone)}</strong>.`,
    ],
    "Continue shopping",
    `${config.frontendUrl}/shop`,
  );
}

export function buildPaymentReceivedEmailText(i: OrderEmailInput): string {
  return `${branding.storeName} — Payment received
===========================================

Hi ${i.firstName},

Thank you for your order #${i.orderId.slice(-8)}.

We received your JazzCash payment screenshot for ${i.total} and we are verifying it. You will get another email as soon as your order is accepted.

Questions? Contact us on ${i.supportPhone}.
`;
}

// ── Admin confirmed the order ────────────────────────────────────────────────

export function buildOrderAcceptedEmailHtml(i: OrderEmailInput): string {
  return layout(
    i.supportPhone,
    "Your order is accepted",
    "Your order is accepted",
    [
      `Hi ${esc(i.firstName)}, good news — your payment for order <strong>#${esc(i.orderId.slice(-8))}</strong> (${esc(i.total)}) is verified and your order has been accepted.`,
      `We are getting it ready for delivery. Questions? Call <strong>${esc(i.supportPhone)}</strong>.`,
    ],
    "Continue shopping",
    `${config.frontendUrl}/shop`,
  );
}

export function buildOrderAcceptedEmailText(i: OrderEmailInput): string {
  return `${branding.storeName} — Order accepted
===========================================

Hi ${i.firstName},

Your payment for order #${i.orderId.slice(-8)} (${i.total}) is verified and your order has been accepted. We are getting it ready for delivery.

Questions? Call ${i.supportPhone}.
`;
}
