import { useTranslations } from "next-intl";

type Props = {
  insights: string[];
};

export default function Insights({ insights }: Props) {
  const t = useTranslations("Dashboard");
  
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
      <h2 className="mb-4 font-display text-xl font-semibold text-brand">{t("insights")}</h2>

      <div className="space-y-2">
        {insights.map((text, index) => (
          <div
            key={index}
            className="rounded-lg border border-emerald-100 bg-emerald-soft/80 px-3 py-2.5 text-sm leading-relaxed text-ink"
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}