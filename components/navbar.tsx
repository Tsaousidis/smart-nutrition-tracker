import {auth, signOut} from "@/auth";
import {getTranslations, getLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import NavbarClient from "./navbar-client";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("Navbar");
  const locale = await getLocale();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            {t("brand")}
          </Link>

          {session?.user && (
            <nav className="flex items-center gap-4 text-sm text-gray-700">
              <Link href="/dashboard">{t("dashboard")}</Link>
              <Link href="/meals">{t("meals")}</Link>
              <Link href="/history">{t("history")}</Link>
              <Link href="/onboarding">{t("profile")}</Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NavbarClient session={session} />

          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({
                  redirectTo: `/${locale}/login`,
                });
              }}
            >
              <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                {t("logout")}
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}