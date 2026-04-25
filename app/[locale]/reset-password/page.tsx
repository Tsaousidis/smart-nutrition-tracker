"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCsrfToken } from "@/lib/useCsrfToken";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const { csrfToken } = useCsrfToken();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      if (!csrfToken) {
        throw new Error("Security error: CSRF token not available");
      }
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
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

  const cardShell =
    "w-full max-w-[440px] rounded-xl border border-border bg-surface p-8 ambient-shadow active-shadow transition-all duration-300";

  if (!token) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
        <div className={cardShell}>
          <h1 className="font-display text-2xl font-semibold text-red-700">{t("invalidToken")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t("tokenExpired")}</p>
          <Link href="/forgot-password" className="link-accent mt-6 inline-block text-sm">
            {t("tryAgain")}
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
        <div className={`${cardShell} text-center`}>
          <div className="mb-4 text-3xl text-brand" aria-hidden>
            ✓
          </div>
          <h1 className="font-display text-[28px] font-semibold text-brand">{t("success")}</h1>
          <p className="mt-3 text-sm text-ink-muted">{t("successMessage")}</p>
          <Link href="/login" className="link-accent mt-6 inline-block text-sm">
            {t("goToLogin")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
      <div className={cardShell}>
        <h1 className="font-display text-[32px] font-semibold text-brand">{t("title")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-stitch" htmlFor="reset-password">
              {t("newPassword")}
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-stitch"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label-stitch" htmlFor="reset-confirm">
              {t("confirmPassword")}
            </label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-stitch"
              placeholder={t("confirmPasswordPlaceholder")}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-brand-lg w-full py-4 disabled:opacity-50">
            {loading ? t("resetting") : t("submit")}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}
