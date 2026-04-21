import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignupForm from "./signup-form";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return <SignupForm />;
}