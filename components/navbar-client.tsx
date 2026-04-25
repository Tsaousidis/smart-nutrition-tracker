"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Session } from "next-auth";

export default function NavbarClient({ session }: { session: Session | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navbar");

  const handleSwitch = (newLocale: "en" | "el") => {
    const newPath = pathname.replace(/^\/(en|el)/, "") || "/";
    router.push(`/${newLocale}${newPath}`);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center rounded-lg border border-border bg-surface-soft p-0.5"
        role="group"
        aria-label={t("languagePicker")}
      >
        <button
          type="button"
          onClick={() => handleSwitch("en")}
          aria-label={t("switchToEnglish")}
          aria-pressed={locale === "en"}
          title={t("switchToEnglish")}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
            locale === "en"
              ? "bg-surface shadow-sm ring-1 ring-border"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          <img
            src="/flags/gb.webp"
            alt=""
            width={24}
            height={16}
            className="pointer-events-none h-4 w-auto max-w-[26px] object-contain"
            draggable={false}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("el")}
          aria-label={t("switchToGreek")}
          aria-pressed={locale === "el"}
          title={t("switchToGreek")}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
            locale === "el"
              ? "bg-surface shadow-sm ring-1 ring-border"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          <img
            src="/flags/gr.webp"
            alt=""
            width={24}
            height={16}
            className="pointer-events-none h-4 w-auto max-w-[26px] object-contain"
            draggable={false}
            aria-hidden
          />
        </button>
      </div>

      {session?.user ? (
        <span className="hidden max-w-[200px] truncate text-sm text-ink-muted md:inline">
          {session.user.email}
        </span>
      ) : null}
    </div>
  );
}