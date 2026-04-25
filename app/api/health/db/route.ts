import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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