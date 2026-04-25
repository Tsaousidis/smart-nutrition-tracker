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
    <main className="min-h-screen bg-canvas text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border pb-20 pt-20 md:pb-28 md:pt-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-emerald-50/40 via-transparent to-amber-50/25"
          aria-hidden
        />
        <div className="mx-auto max-w-[1152px] px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            {t("heroEyebrow")}
          </p>
          <h1 className="font-display mt-4 max-w-3xl mx-auto text-4xl font-bold leading-[1.1] tracking-tight text-brand md:text-5xl lg:text-[3rem]">
            {t("heroHeadline")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
            {t("heroSub")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-8 py-4 text-xs font-bold uppercase tracking-wider text-on-brand shadow-lg transition hover:bg-brand-hover active:scale-[0.98] sm:w-auto"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-border-strong bg-surface px-8 py-4 text-xs font-bold uppercase tracking-wider text-brand transition hover:bg-surface-soft sm:w-auto"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </section>

      {/* Live example */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            {t("demoLabel")}
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 ambient-shadow md:p-8">
            <blockquote className="text-center text-lg font-medium leading-relaxed text-ink md:text-xl">
              «{t("demoMealText")}»
            </blockquote>
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
              <DemoStat label={t("demoCalories")} value={t("demoCaloriesValue")} unit={t("demoKcal")} />
              <DemoStat label={t("demoProtein")} value={t("demoProteinValue")} unit={t("demoGrams")} />
              <DemoStat label={t("demoCarbs")} value={t("demoCarbsValue")} unit={t("demoGrams")} />
              <DemoStat label={t("demoFat")} value={t("demoFatValue")} unit={t("demoGrams")} />
            </div>
            <p className="mt-6 text-center text-xs text-ink-muted">{t("demoDisclaimer")}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1152px]">
          <h2 className="text-center font-display text-3xl font-bold text-brand md:text-4xl">
            {t("stepsTitle")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-8">
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
      <section className="bg-surface px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-brand md:text-4xl">
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
      <section className="px-6 pb-20 pt-4 md:pb-28">
        <div className="relative mx-auto max-w-[1152px] overflow-hidden rounded-[48px] bg-emerald-950 px-8 py-14 text-center shadow-2xl md:px-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12] bg-gradient-to-br from-emerald-600/30 to-amber-500/20"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">
              {t("heroEyebrow")}
            </span>
            <h2 className="max-w-2xl font-display text-2xl font-bold leading-tight text-white md:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto max-w-lg text-sm text-emerald-100/85 md:text-base">{t("ctaSub")}</p>
            <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-100 px-10 py-4 text-xs font-bold uppercase tracking-wider text-brand shadow-lg transition hover:bg-white sm:w-auto"
              >
                {t("ctaButton")}
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/30 px-10 py-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10 sm:w-auto"
              >
                {t("login")}
              </Link>
            </div>
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
    <div className="rounded-xl border border-border bg-surface-soft px-3 py-4 text-center">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-brand">
        {value}
        <span className="text-sm font-semibold text-ink-muted"> {unit}</span>
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
    <div className="relative rounded-3xl border border-border-strong bg-surface p-8 ambient-shadow transition-shadow duration-300 hover:shadow-lg">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-on-brand">
        {step}
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-brand">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
      <p className="mt-4 rounded-lg bg-surface-soft px-3 py-2 text-center text-sm font-medium text-ink">
        {example}
      </p>
    </div>
  );
}

function ValueRow({ label, negative }: { label: string; negative?: boolean }) {
  return (
    <li
      className={`flex items-start gap-4 rounded-xl border px-4 py-4 md:px-5 md:py-4 ${
        negative
          ? "border-border bg-surface text-ink-muted"
          : "border-emerald-200/80 bg-emerald-soft text-ink"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          negative ? "bg-red-50 text-red-600" : "bg-brand text-on-brand"
        }`}
        aria-hidden
      >
        {negative ? "✗" : "✓"}
      </span>
      <span className={`text-base font-medium leading-snug ${negative ? "line-through decoration-ink-muted" : ""}`}>
        {label}
      </span>
    </li>
  );
}
