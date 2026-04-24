import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("HomePage");

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200/80 bg-white/70 px-4 pb-16 pt-16 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {t("heroEyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
            {t("heroHeadline")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 md:text-xl">
            {t("heroSub")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 sm:w-auto"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </section>

      {/* Live example */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
            {t("demoLabel")}
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <blockquote className="text-center text-lg font-medium leading-relaxed text-slate-800 md:text-xl">
              «{t("demoMealText")}»
            </blockquote>
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
              <DemoStat label={t("demoCalories")} value={t("demoCaloriesValue")} unit={t("demoKcal")} />
              <DemoStat label={t("demoProtein")} value={t("demoProteinValue")} unit={t("demoGrams")} />
              <DemoStat label={t("demoCarbs")} value={t("demoCarbsValue")} unit={t("demoGrams")} />
              <DemoStat label={t("demoFat")} value={t("demoFatValue")} unit={t("demoGrams")} />
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">{t("demoDisclaimer")}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200/80 bg-slate-50/80 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
            {t("stepsTitle")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            <StepCard
              step={1}
              title={t("step1Title")}
              body={t("step1Body")}
              example={t("step1Example")}
            />
            <StepCard
              step={2}
              title={t("step2Title")}
              body={t("step2Body")}
              example={t("step2Example")}
            />
            <StepCard
              step={3}
              title={t("step3Title")}
              body={t("step3Body")}
              example={t("step3Example")}
            />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
            {t("valueTitle")}
          </h2>
          <ul className="mt-10 space-y-4">
            <ValueRow negative label={t("valueNo1")} />
            <ValueRow negative label={t("valueNo2")} />
            <ValueRow label={t("valueYes1")} />
            <ValueRow label={t("valueYes2")} />
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 pt-4 md:pb-28">
        <div className="mx-auto max-w-3xl rounded-3xl bg-slate-900 px-6 py-12 text-center shadow-xl md:px-12 md:py-14">
          <h2 className="text-2xl font-bold text-white md:text-3xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-300">{t("ctaSub")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
            >
              {t("ctaButton")}
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function DemoStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-4 text-center">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
        {value}
        <span className="text-sm font-semibold text-slate-600"> {unit}</span>
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  body,
  example,
}: {
  step: number;
  title: string;
  body: string;
  example: string;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
        {step}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-800">
        {example}
      </p>
    </div>
  );
}

function ValueRow({ label, negative }: { label: string; negative?: boolean }) {
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border px-4 py-4 md:px-5 md:py-4 ${
        negative
          ? "border-slate-200 bg-white text-slate-500"
          : "border-emerald-200/80 bg-emerald-50/60 text-slate-800"
      }`}
    >
      <span className="mt-0.5 text-lg leading-none" aria-hidden>
        {negative ? "✗" : "✓"}
      </span>
      <span className={`text-base font-medium ${negative ? "line-through decoration-slate-400" : ""}`}>
        {label}
      </span>
    </li>
  );
}
