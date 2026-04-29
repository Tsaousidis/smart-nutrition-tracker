import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Internal health check - requires authentication
export async function GET() {
  const session = await auth();
  
  // Only allow authenticated users or internal requests
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: "Database connection works.",
    });
  } catch (error) {
    console.error("DB health check error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Database connection failed.",
      },
      { status: 500 }
    );
  }
}