"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCsrfToken } from "@/lib/useCsrfToken";

export default function VerifyEmailPage() {
  const t = useTranslations("VerifyEmail");
  const searchParams = useSearchParams();
  const { csrfToken } = useCsrfToken();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setError(t("invalidLink"));
        setLoading(false);
        return;
      }

      try {
        if (!csrfToken) {
          throw new Error("Security error: CSRF token not available");
        }
        const res = await fetch("/api/verify-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message);
        }

        setSuccess(true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [csrfToken, t, token]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <h1 className="mb-2 text-2xl font-bold">{t("verifying")}</h1>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-4xl">❌</div>
            <h1 className="mb-2 text-2xl font-bold text-red-600">{t("verificationFailed")}</h1>
            <p className="mb-6 text-sm text-gray-600">{error}</p>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              {t("goToLogin")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h1 className="mb-2 text-2xl font-bold">{t("success")}</h1>
            <p className="mb-6 text-sm text-gray-600">{t("successMessage")}</p>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              {t("goToLogin")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return null;
}