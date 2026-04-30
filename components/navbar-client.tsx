"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Image from "next/image";

export default function NavbarClient({
  session,
  locale,
  logoutLabel,
}: {
  session: Session | null;
  locale: string;
  logoutLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations("Navbar");

  const handleSwitch = (newLocale: "en" | "el") => {
    const newPath = pathname.replace(/^\/(en|el)/, "") || "/";
    router.push(`/${newLocale}${newPath}`);
  };

  async function handleLogout() {
    // Unregister any service workers first (fixes localhost:10000 redirect issue)
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (err) {
        console.log("SW unregister error:", err);
      }
    }

    await signOut({ redirect: false });
    window.location.href = `/${locale}/login`;
  }

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
          aria-pressed={currentLocale === "en"}
          title={t("switchToEnglish")}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
            currentLocale === "en"
              ? "bg-surface shadow-sm ring-1 ring-border"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          <Image
            src="/flags/gb.webp"
            alt=""
            width={26}
            height={20}
            className="pointer-events-none object-contain"
            aria-hidden
            unoptimized
          />
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("el")}
          aria-label={t("switchToGreek")}
          aria-pressed={currentLocale === "el"}
          title={t("switchToGreek")}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
            currentLocale === "el"
              ? "bg-surface shadow-sm ring-1 ring-border"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          <Image
            src="/flags/gr.webp"
            alt=""
            width={26}
            height={20}
            className="pointer-events-none object-contain"
            aria-hidden
            unoptimized
          />
        </button>
      </div>

      {session?.user ? (
        <span className="hidden max-w-[200px] truncate text-sm text-ink-muted md:inline">
          {session.user.email}
        </span>
      ) : null}

      {session?.user && logoutLabel ? (
        <button
          type="button"
          onClick={handleLogout}
          className="hidden rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-brand shadow-md transition hover:bg-brand-hover active:scale-[0.98] md:block"
        >
          {logoutLabel}
        </button>
      ) : null}
    </div>
  );
}