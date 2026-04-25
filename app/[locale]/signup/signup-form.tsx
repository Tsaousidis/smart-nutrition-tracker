"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useCsrfToken } from "@/lib/useCsrfToken";
import { Link } from "@/i18n/navigation";

export default function SignupForm() {
  const t = useTranslations("Signup");
  const router = useRouter();
  const locale = useLocale();
  const { csrfToken } = useCsrfToken();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!csrfToken) {
      setError("Security error: CSRF token not available");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ email, password, locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign up");

      setMessage(t("verifyEmailSent"));
      setTimeout(() => { router.push(`/${locale}/login`); }, 5000);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown signup error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 glass-gradient">
      <div className="w-full max-w-[440px]">
        <div className="rounded-xl border border-border bg-surface p-8 ambient-shadow active-shadow transition-all duration-300">
          <div className="mb-8 text-center">
            <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-brand">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-ink-muted opacity-90">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label-stitch" htmlFor="signup-email">
                {t("email")}
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-stitch"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label-stitch" htmlFor="signup-password">
                {t("password")}
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-stitch"
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brand-lg mt-2 w-full py-4 disabled:opacity-50"
            >
              {loading ? t("loading") : t("submit")}
            </button>
          </form>

          {message ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-soft p-4 text-sm text-emerald-900">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-ink-muted">
            {t("haveAccount")}{" "}
            <Link href="/login" className="link-accent">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}