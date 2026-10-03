import { config } from "../config.js";
import { branding } from "@ecommerce/contracts";

export function buildResetEmailHtml(
  firstName: string,
  email: string,
  resetUrl: string,
  expiresFormatted: string,
): string {
  const year = new Date().getFullYear();
  const supportUrl = `${config.frontendUrl}/contact-us`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
    <title>Click the button to securely reset your ${branding.storeName} password.</title>
    <style>
      @media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}
    </style>
  </head>
  <body dir="ltr" lang="en" style="background-color:#f0f0f0">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
      Click the button to securely reset your ${branding.storeName} password.
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td dir="ltr" lang="en" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:14px;min-height:100%;line-height:155%;background-color:#f0f0f0">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;width:100%;border-radius:0px">
              <tbody>
                <tr style="width:100%">
                  <td style="padding:0">

                    <!-- Header -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1a1a1a">
                      <tbody>
                        <tr>
                          <td style="padding:28px 40px">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td style="vertical-align:middle;border-left:3px solid #f25862;padding-left:14px">
                                    <p style="margin:0 0 6px;font-size:20px;color:#ffffff;line-height:100%;font-weight:800;letter-spacing:4px">${branding.shortName}</p>
                                    <p style="margin:0;font-size:9px;color:#f25862;line-height:100%;font-weight:700;letter-spacing:3px">FOOTWEAR</p>
                                  </td>
                                  <td style="vertical-align:middle;text-align:right">
                                    <p style="margin:0;font-size:10px;color:#6a6a6a;line-height:100%;font-weight:700;letter-spacing:3px;text-align:right">SECURITY</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Accent stripe -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f25862;height:4px;font-size:0;line-height:0">
                      <tbody><tr><td style="padding:0;height:4px"></td></tr></tbody>
                    </table>

                    <!-- Body -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff">
                      <tbody>
                        <tr>
                          <td style="padding:52px 48px 40px">

                            <!-- Icon + heading row -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td style="vertical-align:middle;width:56px;padding:0;line-height:0">
                                    <table width="56" height="56" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:56px;height:56px;background-color:#fff5f5;border-radius:50%">
                                      <tbody><tr><td style="padding:0;text-align:center;vertical-align:middle;line-height:1"><span style="font-size:20px;line-height:1">🔑</span></td></tr></tbody>
                                    </table>
                                  </td>
                                  <td style="vertical-align:middle;padding:0 0 0 16px">
                                    <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#252525;letter-spacing:-0.5px"><em>Reset your password</em></h1>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <p style="margin:24px 0 16px;font-size:15px;color:#6a6a6a;line-height:150%">Hi, <span style="color:#252525"><strong>${firstName}</strong></span></p>
                            <p style="margin:0 0 32px;font-size:14px;color:#6a6a6a;line-height:175%">
                              We received a request to reset the password for your ${branding.storeName} account linked to
                              <span style="color:#252525"><strong>${email}</strong></span>.
                              Click the button below to set a new password.
                            </p>

                            <!-- CTA button -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td align="center">
                                    <a href="${resetUrl}" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;padding:16px 44px;background-color:#f25862;color:#ffffff;border-radius:0;font-weight:800;font-size:11px;text-align:center;letter-spacing:2.5px;text-transform:uppercase" target="_blank">
                                      <span style="max-width:100%;display:inline-block;line-height:120%">RESET MY PASSWORD →</span>
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <!-- Fallback link -->
                            <p style="margin:36px 0 8px;font-size:12px;color:#888888;line-height:175%">Button not working? Use the link below:</p>
                            <p style="margin:0 0 32px;font-size:12px;color:#6a6a6a;line-height:175%">
                              <a href="${resetUrl}" rel="noopener noreferrer nofollow" style="color:#f25862;text-decoration:underline" target="_blank">Reset Password Link</a>
                            </p>

                            <!-- Expiry callout -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fff8f8;border-left:3px solid #f25862">
                              <tbody>
                                <tr>
                                  <td style="padding:14px 18px">
                                    <p style="margin:0;font-size:12px;color:#555555;line-height:160%">
                                      ⏰ Expires on <strong>${expiresFormatted}</strong> — valid for 1 hour, single use only.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Divider -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff">
                      <tbody><tr><td style="padding:0 48px"><hr style="border:none;border-top:1px solid #eaeaea;margin:0" /></td></tr></tbody>
                    </table>

                    <!-- Security notice -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fafafa">
                      <tbody>
                        <tr>
                          <td style="padding:24px 48px">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td style="vertical-align:top;padding-right:12px"><p style="margin:0;font-size:18px;color:#6a6a6a;line-height:130%">🔒</p></td>
                                  <td style="vertical-align:top">
                                    <p style="margin:0 0 6px;font-size:13px;color:#252525;line-height:150%;font-weight:700">Didn&#x27;t request this?</p>
                                    <p style="margin:0;font-size:12px;color:#6a6a6a;line-height:170%">
                                      You can safely ignore this email — your password won&#x27;t change and this link expires automatically.
                                      If you&#x27;re concerned, please
                                      <a href="${supportUrl}" rel="noopener noreferrer nofollow" style="color:#f25862;text-decoration:underline" target="_blank">contact our support team</a>.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Footer -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;border-top:1px solid #eaeaea">
                      <tbody>
                        <tr>
                          <td style="padding:24px 48px">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td style="vertical-align:middle">
                                    <p style="margin:0 0 4px;font-size:11px;color:#aaaaaa;line-height:160%">© ${year} ${branding.storeName}. All rights reserved.</p>
                                    <p style="margin:0;font-size:11px;color:#cccccc;line-height:160%">This is a transactional email — please do not reply.</p>
                                  </td>
                                  <td style="vertical-align:middle;text-align:right;padding-left:20px">
                                    <p style="margin:0;font-size:9px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:#dddddd">${branding.shortName}</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}

export function buildResetEmailText(
  firstName: string,
  email: string,
  resetUrl: string,
  expiresFormatted: string,
): string {
  return `${branding.storeName} — Password Reset
===========================================

Hi ${firstName},

We received a request to reset the password for your ${branding.storeName} account
associated with ${email}.

Click or copy the link below to reset your password:

  ${resetUrl}

This link expires on ${expiresFormatted} and can only be used once.

If you did not request a password reset, you can safely ignore this email.

---
© ${new Date().getFullYear()} ${branding.storeName}. All rights reserved.
This is an automated transactional email — please do not reply.
`;
}
