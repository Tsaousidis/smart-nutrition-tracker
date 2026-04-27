type MealItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: string;
  title: string | null;
  mealDate: string;
  items: MealItem[];
};

type DailySummaryProps = {
  meals: Meal[];
};

export default function DailySummary({ meals }: DailySummaryProps) {
  if (meals.length === 0) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Today&apos;s Meals</h2>
        <p className="mt-3 text-sm text-gray-600">No meals saved for today.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h2 className="text-xl font-semibold">Today&apos;s Meals</h2>

      <div className="mt-4 space-y-4">
        {meals.map((meal) => (
          <div key={meal.id} className="rounded-xl border p-4">
            <div className="mb-3">
              <p className="font-medium">{meal.title || "Untitled Meal"}</p>
              <p className="text-sm text-gray-500">
                {new Date(meal.mealDate).toLocaleString(undefined, {
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })}
              </p>
            </div>

            <div className="space-y-2">
              {meal.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {item.name} — {item.quantity} {item.unit}
                  </p>
                  <p className="text-gray-600">
                    {item.calories} kcal | P: {item.protein}g | C: {item.carbs}g
                    {" | "}F: {item.fat}g
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}