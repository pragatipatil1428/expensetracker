import "server-only";

/**
 * Sends a transactional email through the Resend HTTP API.
 * Used for password reset links. Returns true when a provider is configured
 * and the send succeeded, false otherwise.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "FinTrack <onboarding@resend.dev>",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function buildResetEmailHtml(resetUrl: string): string {
  const escapedUrl = resetUrl.replace(/&/g, "&amp;");
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
      <h1 style="font-size: 20px; margin: 0 0 16px; color: #4f46e5;">FinTrack</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Hi there,</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        We received a request to reset your FinTrack password. Click the button below to
        choose a new one. This link expires in 1 hour.
      </p>
      <a href="${escapedUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
        Reset password
      </a>
      <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 24px 0 0;">
        If you didn't request this, you can safely ignore this email. The link is
        only valid for one hour.
      </p>
      <p style="font-size: 13px; color: #a1a1aa; margin-top: 32px;">FinTrack · Personal finance made simple</p>
    </div>
  `;
}
