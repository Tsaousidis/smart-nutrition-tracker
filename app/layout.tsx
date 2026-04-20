import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/session-provider";

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
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}