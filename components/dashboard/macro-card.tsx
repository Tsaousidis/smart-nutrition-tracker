import { useTranslations } from "next-intl";

type MacroCardProps = {
  title: string;
  total: number;
  target: number;
  remaining: number;
  unit: string;
};

export default function MacroCard({
  title,
  total,
  target,
  remaining,
  unit,
}: MacroCardProps) {
  const t = useTranslations("Dashboard");
  
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-medium">{t("consumed")}:</span> {total} {unit}
        </p>
        <p>
          <span className="font-medium">{t("target")}:</span> {target} {unit}
        </p>
        <p>
          <span className="font-medium">{t("remaining")}:</span> {remaining} {unit}
        </p>
      </div>
    </div>
  );
}