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
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-medium">Consumed:</span> {total} {unit}
        </p>
        <p>
          <span className="font-medium">Target:</span> {target} {unit}
        </p>
        <p>
          <span className="font-medium">Remaining:</span> {remaining} {unit}
        </p>
      </div>
    </div>
  );
}