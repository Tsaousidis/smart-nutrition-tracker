"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  const locale = useLocale();

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">
          {t("title")}
        </h2>
        <p className="mb-6 text-sm text-ink-muted">{t("message")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t("tryAgain")}
          </button>
          <a
            href={`/${locale}/dashboard`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            {t("goToDashboard")}
          </a>
        </div>
      </div>
    </div>
  );
}