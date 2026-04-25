import type { Metadata } from "next";
import { Epilogue, Manrope } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/session-provider";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const epilogue = Epilogue({
  subsets: ["latin", "latin-ext"],
  variable: "--font-epilogue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nutrition Tracker",
  description: "AI-assisted nutrition tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${epilogue.variable}`}>
      <body className={`${manrope.className} min-h-screen bg-canvas text-ink antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
