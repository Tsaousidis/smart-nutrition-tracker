"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";


export default function LoginForm() {
  const t = useTranslations("Login");
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error(t("invalidCredentials"));
      }

      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown login error");
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label-stitch" htmlFor="login-email">
                {t("email")}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-stitch"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="label-stitch mb-0" htmlFor="login-password">
                  {t("password")}
                </label>
                <Link href="/forgot-password" className="link-accent text-[12px]">
                  {t("forgotPassword")}
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-stitch"
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
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

          {error ? (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-ink-muted">
            {t("noAccount")}{" "}
            <Link href="/signup" className="link-accent">
              {t("signupLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}