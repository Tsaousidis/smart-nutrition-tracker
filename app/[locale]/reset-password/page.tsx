"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-red-600">{t("invalidToken")}</h1>
          <p className="mb-6 text-sm text-gray-600">{t("tokenExpired")}</p>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            {t("tryAgain")}
          </Link>
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

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
        <p className="mb-6 text-sm text-gray-600">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("newPassword")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder={t("confirmPasswordPlaceholder")}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? t("resetting") : t("submit")}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}