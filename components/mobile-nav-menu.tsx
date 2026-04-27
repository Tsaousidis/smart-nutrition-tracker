"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";

type MobileNavItem = {
  href: string;
  label: string;
};

type Props = {
  items: MobileNavItem[];
  locale: string;
  menuLabel: string;
  logoutLabel: string;
};

export default function MobileNavMenu({
  items,
  locale,
  menuLabel,
  logoutLabel,
}: Props) {
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    // Use NEXT_PUBLIC_APP_URL if available (production), fallback to dynamic origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const callbackUrl = appUrl 
      ? `${appUrl}/${locale}/login` 
      : (typeof window !== "undefined" && window.location.origin 
        ? `${window.location.origin}/${locale}/login` 
        : `/${locale}/login`);
    await signOut({
      callbackUrl,
    });
  }

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand shadow-sm transition hover:bg-surface-soft"
        aria-expanded={open}
        aria-label={menuLabel}
      >
        {menuLabel}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 min-w-[190px] rounded-xl border border-border bg-surface p-2 shadow-xl">
          <nav className="mb-2 flex flex-col" aria-label={menuLabel}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-soft"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-brand shadow-md transition hover:bg-brand-hover active:scale-[0.98]"
          >
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
