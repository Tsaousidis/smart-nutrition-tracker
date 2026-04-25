"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCsrfToken } from "@/lib/useCsrfToken";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const locale = useLocale();
  const { csrfToken } = useCsrfToken();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!csrfToken) {
        throw new Error("Security error: CSRF token not available");
      }
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message);
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
        <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-8 text-center ambient-shadow">
          <div className="mb-4 text-3xl text-brand" aria-hidden>
            ✓
          </div>
          <h1 className="font-display text-[28px] font-semibold text-brand">{t("emailSent")}</h1>
          <p className="mt-3 text-sm text-ink-muted">{t("checkEmail")}</p>
          <Link href="/login" className="link-accent mt-8 inline-block text-sm">
            {t("backToLogin")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
      <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-8 ambient-shadow active-shadow transition-all duration-300">
        <h1 className="font-display text-[32px] font-semibold text-brand">{t("title")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-stitch" htmlFor="forgot-email">
              {t("email")}
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-stitch"
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-brand-lg w-full py-4 disabled:opacity-50">
            {loading ? t("sending") : t("submit")}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mt-8 text-center text-sm">
          <Link href="/login" className="link-accent">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </main>
  );
}
