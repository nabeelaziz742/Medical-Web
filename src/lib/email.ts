// Transactional email through Resend (https://resend.com). Needs RESEND_API_KEY and EMAIL_FROM,
// where EMAIL_FROM uses a domain verified in Resend, e.g. "SAAD Medical Store <no-reply@saadmedicalstore.com>".
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured (RESEND_API_KEY / EMAIL_FROM missing)");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend rejected the email (${res.status}): ${await res.text()}`);
  }
}
