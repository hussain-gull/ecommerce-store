import { config } from "../config.js";
import { branding } from "@ecommerce/contracts";

export function buildWelcomeEmailHtml(firstName: string): string {
  const year = new Date().getFullYear();
  const shopUrl = config.frontendUrl;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <title>Welcome to ${branding.storeName}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; }
      .email-body-padding { padding: 32px 24px !important; }
      .email-header-padding { padding: 24px !important; }
      .email-footer-padding { padding: 20px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <div style="display:none;font-size:1px;color:#f0f0f0;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Welcome to ${branding.storeName}, ${firstName}! Your account is ready. Step into something new.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-card" cellpadding="0" cellspacing="0" border="0"
          style="width:600px;max-width:600px;background-color:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td class="email-header-padding" style="background-color:#1a1a1a;padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid #f25862;padding-left:12px;">
                          <p style="margin:0;font-size:18px;font-weight:800;letter-spacing:5px;text-transform:uppercase;color:#ffffff;line-height:1.1;">${branding.shortName}</p>
                          <p style="margin:3px 0 0;font-size:8px;font-weight:600;letter-spacing:7px;text-transform:uppercase;color:#f25862;">FOOTWEAR</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#555555;">WELCOME</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent stripe -->
          <tr>
            <td style="background:linear-gradient(90deg,#f25862 0%,#d4404a 100%);height:4px;font-size:4px;line-height:4px;">&nbsp;</td>
          </tr>

          <!-- Hero section -->
          <tr>
            <td style="background-color:#141414;padding:52px 48px 44px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#f25862;">YOU'RE IN</p>
              <h1 style="margin:0 0 16px;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.15;">Welcome to<br>${branding.storeName}</h1>
              <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.75;">
                Hi <strong style="color:#ffffff;">${firstName}</strong> — your account is live and ready. Time to find your next pair.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body-padding" style="padding:44px 48px 40px;">

              <p style="margin:0 0 32px;font-size:14px;color:#555555;line-height:1.75;">
                We&rsquo;re thrilled to have you with us. ${branding.storeName} is built for people who take every step seriously &mdash; whether that&rsquo;s on the pitch, the track, or the street.
              </p>

              <!-- Feature tiles -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 36px;">
                <tr>
                  <td style="width:50%;padding:0 8px 0 0;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:20px;background-color:#f9f9f9;border-top:3px solid #f25862;">
                          <p style="margin:0 0 6px;font-size:18px;">&#128722;</p>
                          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#252525;letter-spacing:0.5px;text-transform:uppercase;">Shop Now</p>
                          <p style="margin:0;font-size:12px;color:#6a6a6a;line-height:1.55;">Browse our full collection of footwear.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="width:50%;padding:0 0 0 8px;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:20px;background-color:#f9f9f9;border-top:3px solid #252525;">
                          <p style="margin:0 0 6px;font-size:18px;">&#10024;</p>
                          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#252525;letter-spacing:0.5px;text-transform:uppercase;">Wishlist</p>
                          <p style="margin:0;font-size:12px;color:#6a6a6a;line-height:1.55;">Save your favourites for later.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${shopUrl}/shop" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="0%"
                stroke="f" fillcolor="#f25862">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">START SHOPPING</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#f25862;">
                    <a href="${shopUrl}/shop" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block;padding:16px 44px;background-color:#f25862;color:#ffffff;font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border:none;">
                      START SHOPPING &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-padding" style="padding:24px 48px;border-top:1px solid #eaeaea;background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;color:#aaaaaa;line-height:1.6;">&copy; ${year} ${branding.storeName}. All rights reserved.</p>
                    <p style="margin:0;font-size:11px;color:#cccccc;line-height:1.6;">This is a transactional email &mdash; please do not reply.</p>
                  </td>
                  <td align="right" valign="bottom">
                    <p style="margin:0;font-size:9px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:#dddddd;">${branding.shortName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function buildWelcomeEmailText(firstName: string): string {
  return `${branding.storeName} — Welcome
===========================================

Hi ${firstName},

Welcome to ${branding.storeName}! Your account is live and ready.

We're thrilled to have you with us. ${branding.storeName} is built for people who take every step seriously — whether that's on the pitch, the track, or the street.

Start shopping:
  ${config.frontendUrl}/shop

---
© ${new Date().getFullYear()} ${branding.storeName}. All rights reserved.
This is an automated transactional email — please do not reply.
`;
}
