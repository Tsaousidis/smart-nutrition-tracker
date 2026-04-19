import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const GET = auth(function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json(
      {
        ok: false,
        message: "Not authenticated",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Authenticated",
    data: req.auth.user,
  });
});