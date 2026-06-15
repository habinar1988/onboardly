// Email service — uses Resend (swap for SendGrid/Postmark by changing the client)
// Install: npm install resend

interface EmailPayload {
  to: string;
  subject: string;
  type: 'welcome' | 'document_request' | 'reminder' | 'completion';
  data: Record<string, string>;
}

const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  welcome: (d) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="color:#1e293b">Welcome, ${d.clientName}! 👋</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6">
        Your onboarding has started. We'll guide you through each step to get everything set up smoothly.
      </p>
      <p style="color:#475569">You'll receive emails as each step becomes available.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
      <p style="color:#94a3b8;font-size:12px">Powered by Onboardly</p>
    </div>`,

  document_request: (d) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="color:#1e293b">Action Required: ${d.documentTitle}</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6">
        Hi ${d.clientName}, a document requires your attention.
      </p>
      <a href="${d.link || '#'}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Review Document →
      </a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
      <p style="color:#94a3b8;font-size:12px">Powered by Onboardly</p>
    </div>`,

  reminder: (d) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="color:#1e293b">Friendly Reminder 🔔</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6">
        Hi ${d.clientName}, just a reminder that your onboarding has a pending step waiting for you.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
      <p style="color:#94a3b8;font-size:12px">Powered by Onboardly</p>
    </div>`,

  completion: (d) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="color:#1e293b">Onboarding Complete! 🎉</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6">
        Congratulations ${d.clientName}! Your onboarding is complete. We're excited to work with you.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
      <p style="color:#94a3b8;font-size:12px">Powered by Onboardly</p>
    </div>`,
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email mock] To: ${payload.to} | Subject: ${payload.subject}`);
    return;
  }

  const html = TEMPLATES[payload.type]?.(payload.data) ?? `<p>${payload.subject}</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'onboarding@onboardly.io',
      to: payload.to,
      subject: payload.subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Email send failed: ${err}`);
  }
}
