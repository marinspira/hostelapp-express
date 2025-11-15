import nodemailer from 'nodemailer';

// Minimal sendEmail util. In production configure SMTP env vars. In development, use Ethereal so
// emails are inspectable via a preview URL.
export default async function sendEmail({ to, subject, text, html }) {
  let transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: !!process.env.SMTP_SECURE,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    console.log('[sendEmail] SMTP not configured and environment is production');
    return { success: false };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
    html,
  });

  return info;
}
