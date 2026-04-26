// Email utility using Resend for sending emails
// Set RESEND_API_KEY in your .env file to enable real email sending

import { Resend } from "resend";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  // If no API key is set, log metadata only — never log HTML (contains verification/reset tokens)
  if (!apiKey) {
    console.log("[email] Dev mode: no RESEND_API_KEY — email not sent.");
    console.log(`[email] To: ${options.to} | Subject: ${options.subject}`);
    console.log("[email] Body omitted from logs (contains secrets). Set RESEND_API_KEY to send for real.");
    return true;
  }

  try {
    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || "Nutrella <onboarding@resend.dev>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendResetEmail(email: string, token: string, locale: string = "en"): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/${locale}/reset-password?token=${token}`;
  
  // Email content based on locale
  const content = locale === "el" ? {
    subject: "Επαναφορά Κωδικού - Nutrella",
    heading: "Επαναφορά Κωδικού",
    message: "Ζητήθηκε επαναφορά κωδικού πρόσβασης για τον λογαριασμό σου στο Nutrella.",
    ctaText: "Κάνε κλικ στον παρακάτω σύνδεσμο για να επαναφέρεις τον κωδικό σου:",
    expiryNote: "Αυτός ο σύνδεσμος θα λήξει σε 1 ώρα.",
    ignoreNote: "Αν δεν ζήτησες επαναφορά κωδικού, παρακαλώ αγνόησε αυτό το email.",
  } : {
    subject: "Password Reset - Nutrella",
    heading: "Password Reset",
    message: "You requested a password reset for your Nutrella account.",
    ctaText: "Click the link below to reset your password:",
    expiryNote: "This link will expire in 1 hour.",
    ignoreNote: "If you didn't request this, please ignore this email.",
  };
  
  return sendEmail({
    to: email,
    subject: content.subject,
    html: `
      <h2>${content.heading}</h2>
      <p>${content.message}</p>
      <p>${content.ctaText}</p>
      <p><a href="${resetUrl}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${locale === "el" ? "Επαναφορά Κωδικού" : "Reset Password"}</a></p>
      <p>${content.expiryNote}</p>
      <p>${content.ignoreNote}</p>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string, locale: string = "en"): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/${locale}/verify-email?token=${token}`;
  
  // Email content based on locale
  const content = locale === "el" ? {
    subject: "Επαλαθέωσε το email σου - Nutrella",
    heading: "Καλωσόρισες στο Nutrella!",
    message: "Παρακαλώ επαλαθέωσε τη διεύθυνση email σου κάνοντας κλικ στον παρακάτω σύνδεσμο:",
    expiryNote: "Αυτός ο σύνδεσμος θα λήξει σε 24 ώρες.",
    ignoreNote: "Αν δεν δημιούργησες λογαριασμό, παρακαλώ αγνόησε αυτό το email.",
  } : {
    subject: "Verify your email - Nutrella",
    heading: "Welcome to Nutrella!",
    message: "Please verify your email address by clicking the link below:",
    expiryNote: "This link will expire in 24 hours.",
    ignoreNote: "If you didn't create an account, please ignore this email.",
  };
  
  return sendEmail({
    to: email,
    subject: content.subject,
    html: `
      <h2>${content.heading}</h2>
      <p>${content.message}</p>
      <p><a href="${verifyUrl}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${locale === "el" ? "Επαλαθέωση Email" : "Verify Email"}</a></p>
      <p>${content.expiryNote}</p>
      <p>${content.ignoreNote}</p>
    `,
  });
}