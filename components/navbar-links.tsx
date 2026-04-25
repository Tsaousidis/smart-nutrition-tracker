"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

export type NavbarLinkItem = { href: string; label: string };

export default function NavbarLinks({ items }: { items: NavbarLinkItem[] }) {
  const pathname = usePathname() ?? "";
  const normalized = pathname.replace(/^\/(en|el)/, "") || "/";

  return (
    <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
      {items.map(({ href, label }) => {
        const active =
          normalized === href ||
          (href !== "/" && normalized.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            className={`font-display text-sm font-medium tracking-tight transition active:scale-95 ${
              active
                ? "border-b-2 border-brand pb-1 text-brand"
                : "text-ink-muted hover:text-brand"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
