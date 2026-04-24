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
  
  // If no API key is set, log the email (development mode)
  if (!apiKey) {
    console.log("=== EMAIL (Development - No API Key) ===");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.html}`);
    console.log("===========");
    return true;
  }

  try {
    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: "Nutrition Tracker <onboarding@resend.dev>",
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
    subject: "Επαναφορά Κωδικού - Nutrition Tracker",
    heading: "Επαναφορά Κωδικού",
    message: "Ζητήθηκε επαναφορά κωδικού πρόσβασης για τον λογαριασμό σου στο Nutrition Tracker.",
    ctaText: "Κάνε κλικ στον παρακάτω σύνδεσμο για να επαναφέρεις τον κωδικό σου:",
    expiryNote: "Αυτός ο σύνδεσμος θα λήξει σε 1 ώρα.",
    ignoreNote: "Αν δεν ζήτησες επαναφορά κωδικού, παρακαλώ αγνόησε αυτό το email.",
  } : {
    subject: "Password Reset - Nutrition Tracker",
    heading: "Password Reset",
    message: "You requested a password reset for your Nutrition Tracker account.",
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
    subject: "Επαλαθέωσε το email σου - Nutrition Tracker",
    heading: "Καλωσόρισες στο Nutrition Tracker!",
    message: "Παρακαλώ επαλαθέωσε τη διεύθυνση email σου κάνοντας κλικ στον παρακάτω σύνδεσμο:",
    expiryNote: "Αυτός ο σύνδεσμος θα λήξει σε 24 ώρες.",
    ignoreNote: "Αν δεν δημιούργησες λογαριασμό, παρακαλώ αγνόησε αυτό το email.",
  } : {
    subject: "Verify your email - Nutrition Tracker",
    heading: "Welcome to Nutrition Tracker!",
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