import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
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

  if (!user) {
    redirect("/login");
  }

  if (!user.profile || !user.goal) {
    redirect("/onboarding");
  }

  return <DashboardClient />;
}