import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            Nutrition Tracker
          </Link>

          {session?.user && (
            <nav className="flex items-center gap-4 text-sm text-gray-700">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/meals">Meals</Link>
              <Link href="/history">History</Link>
              <Link href="/onboarding">Profile</Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-gray-500 md:inline">
                {session.user.email}
              </span>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                  Log Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}