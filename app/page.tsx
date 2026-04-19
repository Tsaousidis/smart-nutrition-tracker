import { auth } from "@/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          AI-Powered Nutrition Tracking
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          Track your meals with natural language, let AI estimate your nutrition,
          and monitor your daily and weekly progress effortlessly.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 md:flex-row md:justify-center">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-black px-6 py-3 text-white"
              >
                Go to Dashboard
              </Link>

              <Link
                href="/meals"
                className="rounded-xl border px-6 py-3"
              >
                Add Meal
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-xl bg-black px-6 py-3 text-white"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border px-6 py-3"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">AI Meal Parsing</h3>
            <p className="mt-2 text-sm text-gray-600">
              Describe your meal in plain English and let AI break it down into
              calories and macros.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">Daily Targets</h3>
            <p className="mt-2 text-sm text-gray-600">
              Automatically calculated calorie and macro goals based on your
              profile and fitness objective.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="text-lg font-semibold">Progress Tracking</h3>
            <p className="mt-2 text-sm text-gray-600">
              Monitor your daily and weekly nutrition with clear insights and
              structured data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}