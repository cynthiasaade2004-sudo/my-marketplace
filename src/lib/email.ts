import nodemailer from 'nodemailer';

function requiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required email setting: ${name}`);
  }
  return value;
}

export async function sendGeneratedPasswordEmail(email: string, password: string) {
  const transporter = createEmailTransport();
  await transporter.verify();
  await transporter.sendMail({
    from: requiredSetting('SMTP_FROM'),
    to: email,
    subject: 'Your Marketplace sign-in password',
    text: [
      'Your Marketplace account is ready.',
      '',
      `Sign-in email: ${email}`,
      `Temporary password: ${password}`,
      '',
      'Keep this password private and do not forward this email.',
    ].join('\n'),
  });
}

export function createEmailTransport() {
  const host = requiredSetting('SMTP_HOST');
  const port = Number(requiredSetting('SMTP_PORT'));
  requiredSetting('SMTP_FROM');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid port number');
  }
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('SMTP_USER and SMTP_PASS must be configured together');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}
