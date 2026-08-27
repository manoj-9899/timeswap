export function renderVerificationEmail(link: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your TimeSwap Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfdfd; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #191c1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcfdfd; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f7; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background-color: #0b6057; border-radius: 14px; color: #ffffff; font-size: 24px; font-weight: 800;">
                ⚡
              </div>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #00473f; letter-spacing: -0.02em;">TimeSwap</h1>
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <span style="background-color: rgba(156, 242, 232, 0.4); border: 1px solid #80d5cb; color: #00504a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px; display: inline-block;">
                Account Verification
              </span>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-weight: 800; color: #191c1b;">Welcome to the Skill Exchange! 👋</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #3f4947;">
                You're one step away from joining TimeSwap. Verify your email to activate your account and claim your <strong>+1.00 Time Credit</strong> starter grant.
              </p>
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="${link}" style="background-color: #0b6057; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Verify Email Address &rarr;
              </a>
            </td>
          </tr>

          <!-- Direct Link Fallback -->
          <tr>
            <td style="padding-top: 16px; border-t: 1px solid #e2e8f7; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #515f5d;">If the button above doesn't work, copy and paste this URL into your web browser:</p>
              <p style="margin: 0; font-size: 11px; word-break: break-all; color: #0b6057; font-family: monospace;">${link}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 11px; color: #8e9996;">
                This link will expire in 24 hours. If you did not create a TimeSwap account, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderPasswordResetEmail(link: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your TimeSwap Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfdfd; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #191c1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcfdfd; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f7; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background-color: #0b6057; border-radius: 14px; color: #ffffff; font-size: 24px; font-weight: 800;">
                ⚡
              </div>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #00473f; letter-spacing: -0.02em;">TimeSwap</h1>
            </td>
          </tr>

          <!-- Password Reset Banner -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <span style="background-color: #ffdcc3; border: 1px solid #ffb77d; color: #663500; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px; display: inline-block;">
                Security Request
              </span>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-weight: 800; color: #191c1b;">Password Reset Request</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #3f4947;">
                We received a request to reset your TimeSwap account password for <strong>${email}</strong>. Click the button below to choose a new password.
              </p>
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="${link}" style="background-color: #0b6057; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Reset Password Now &rarr;
              </a>
            </td>
          </tr>

          <!-- Direct Link Fallback -->
          <tr>
            <td style="padding-top: 16px; border-t: 1px solid #e2e8f7; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #515f5d;">If the button above doesn't work, copy and paste this URL into your web browser:</p>
              <p style="margin: 0; font-size: 11px; word-break: break-all; color: #0b6057; font-family: monospace;">${link}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 11px; color: #8e9996;">
                This password reset link is valid for 1 hour. If you did not request a password reset, your account is safe and no action is required.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
