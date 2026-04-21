import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { getLocale } from "next-intl/server";

export default async function DashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  // ❗ not logged in
  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      profile: true,
      goal: true,
    },
  });

  // ❗ user not found
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // ❗ onboarding incomplete
  if (!user.profile || !user.goal) {
    redirect(`/${locale}/onboarding`);
  }

  return <DashboardClient />;
}