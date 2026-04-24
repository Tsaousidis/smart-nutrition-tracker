// Email utility - in production, integrate with SendGrid, Resend, etc.
// For now, logs to console for development

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In production, replace with actual email service
  console.log("=== EMAIL ===");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body: ${options.html}`);
  console.log("===========");
  
  return true;
}

export async function sendResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Password Reset - Nutrition Tracker",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your Nutrition Tracker account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
}