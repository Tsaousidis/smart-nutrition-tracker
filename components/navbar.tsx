import { auth } from "@/auth";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NavbarClient from "./navbar-client";
import NavbarLinks from "./navbar-links";
import MobileNavMenu from "./mobile-nav-menu";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("Navbar");
  const locale = await getLocale();

  const navItems = session?.user
    ? [
        { href: "/dashboard", label: t("dashboard") },
        { href: "/meals", label: t("meals") },
        { href: "/history", label: t("history") },
        { href: "/onboarding", label: t("profile") },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1152px] items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-brand"
          >
            {t("brand")}
          </Link>
          {navItems.length > 0 ? <NavbarLinks items={navItems} /> : null}
        </div>

        <div className="relative flex shrink-0 items-center gap-3">
          <NavbarClient
            session={session}
            locale={locale}
            logoutLabel={session?.user ? t("logout") : undefined}
          />

          {session?.user ? (
            <MobileNavMenu
              items={navItems}
              locale={locale}
              menuLabel={t("menu")}
              logoutLabel={t("logout")}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
