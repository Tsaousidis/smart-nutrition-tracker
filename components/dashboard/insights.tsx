import { useTranslations } from "next-intl";

type Props = {
  insights: string[];
};

export default function Insights({ insights }: Props) {
  const t = useTranslations("Dashboard");
  
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">{t("insights")}</h2>

      <div className="space-y-2">
        {insights.map((text, index) => (
          <div
            key={index}
            className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}