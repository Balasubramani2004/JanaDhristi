/**
 * ForThePeople.in — Email Helper (Resend REST API)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, html, replyTo }: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ForThePeople.in <noreply@forthepeople.in>",
        to,
        subject,
        html,
        reply_to: replyTo || process.env.ADMIN_EMAIL || "support@forthepeople.in",
      }),
    });
    if (!res.ok) return { success: false, error: await res.text() };
    const data = await res.json();
    return { success: true, id: data.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
