/**
 * ForThePeople.in — Feedback Reply System
 * Saves reply to DB and optionally emails the user.
 */

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function replyToFeedback(
  feedbackId: string,
  replyText: string,
  sendEmailToUser: boolean
): Promise<{ success: boolean; emailSent: boolean; error?: string }> {
  const fb = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { email: true, subject: true, message: true, name: true },
  });

  if (!fb) return { success: false, emailSent: false, error: "Feedback not found" };

  // Save reply to DB
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      adminReply: replyText,
      adminRepliedAt: new Date(),
      adminRepliedBy: "admin",
      replyMethod: sendEmailToUser && fb.email ? "email" : "none",
    },
  });

  let emailSent = false;

  if (sendEmailToUser && fb.email) {
    const snippet = fb.message.slice(0, 200) + (fb.message.length > 200 ? "..." : "");
    const result = await sendEmail({
      to: fb.email,
      subject: `Re: ${fb.subject} — ForThePeople.in`,
      html: `
        <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="padding:16px 20px;background:#2563EB;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;color:#fff;font-size:16px;">Response to Your Feedback</h2>
          </div>
          <div style="padding:20px;background:#FAFAF8;border:1px solid #E8E8E4;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 12px;font-size:13px;color:#9B9B9B;">Your feedback:</p>
            <p style="margin:0 0 16px;font-size:13px;color:#6B6B6B;font-style:italic;">"${snippet}"</p>
            <hr style="border:none;border-top:1px solid #E8E8E4;margin:16px 0;" />
            <p style="margin:0 0 12px;font-size:13px;color:#9B9B9B;">Our response:</p>
            <p style="margin:0 0 16px;font-size:14px;color:#1A1A1A;line-height:1.6;">${replyText}</p>
            <hr style="border:none;border-top:1px solid #E8E8E4;margin:16px 0;" />
            <p style="margin:0;font-size:11px;color:#9B9B9B;">
              ForThePeople.in — Your district. Your data. Your right.<br/>
              This is a one-time reply. Submit new feedback at
              <a href="https://forthepeople.in" style="color:#2563EB;">forthepeople.in</a>
            </p>
          </div>
        </div>
      `,
    });

    emailSent = result.success;

    if (emailSent) {
      await prisma.feedback.update({
        where: { id: feedbackId },
        data: { replySentAt: new Date() },
      });
    }
  }

  return { success: true, emailSent };
}
