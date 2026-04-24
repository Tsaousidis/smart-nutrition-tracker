import {auth} from "@/auth";
import {getTranslations, getLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("HomePage");

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          {t("title")}
        </h1>

        <p className="mt-6 text-lg text-gray-600">{t("description")}</p>

        <div className="mt-10 flex flex-col items-center gap-4 md:flex-row md:justify-center">
          {session?.user ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="rounded-xl bg-black px-6 py-3 text-white"
              >
                {t("goToDashboard")}
              </Link>

              <Link href="/meals" className="rounded-xl border px-6 py-3">
                {t("addMeal")}
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="rounded-xl bg-black px-6 py-3 text-white">
                {t("getStarted")}
              </Link>

              <Link href="/login" className="rounded-xl border px-6 py-3">
                {t("login")}
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">{t("feature1Title")}</h3>
            <p className="mt-2 text-sm text-gray-600">{t("feature1Text")}</p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">{t("feature2Title")}</h3>
            <p className="mt-2 text-sm text-gray-600">{t("feature2Text")}</p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">{t("feature3Title")}</h3>
            <p className="mt-2 text-sm text-gray-600">{t("feature3Text")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}