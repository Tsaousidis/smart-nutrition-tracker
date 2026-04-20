import {auth, signOut} from "@/auth";
import {getTranslations, getLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("Navbar");
  const locale = await getLocale();

  const switchTo = locale === "en" ? "el" : "en";

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
          <div className="flex items-center gap-2">
            <Link
              href="/"
              locale="en"
              className={`rounded border px-2 py-1 text-sm ${locale === "en" ? "bg-gray-100" : ""}`}
              aria-label="Switch to English"
            >
              🇬🇧
            </Link>
            <Link
              href="/"
              locale="el"
              className={`rounded border px-2 py-1 text-sm ${locale === "el" ? "bg-gray-100" : ""}`}
              aria-label="Αλλαγή στα Ελληνικά"
            >
              🇬🇷
            </Link>
          </div>

          {session?.user ? (
            <>
              <span className="hidden text-sm text-gray-500 md:inline">
                {session.user.email}
              </span>

              <form
                action={async () => {
                  "use server";
                  await signOut({redirectTo: `/${switchTo === "en" ? "el" : "en"}/login`});
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border px-4 py-2 text-sm">
                {t("login")}
              </Link>
              <Link href="/signup" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}