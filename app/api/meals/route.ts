import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveMealSchema } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const parsedBody = saveMealSchema.safeParse({
      ...body,
      email: session.user.email,
    });

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request body",
          errors: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, title, mealDate, items } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Authenticated user not found",
        },
        { status: 404 }
      );
    }

    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        title: title || null,
        mealDate: new Date(mealDate),
        items: {
          create: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Meal saved successfully",
      data: meal,
    });
  } catch (error) {
    console.error("Save meal route error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while saving the meal",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Rate limit for delete operations (20 deletes per 15 min)
    const ip = getClientIp(req);
    const rate = await checkRateLimit({
      key: `meal-delete:${session.user.email}:${ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: "Too many delete requests. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const mealId = searchParams.get("id");

    if (!mealId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Meal ID is required",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Authenticated user not found",
        },
        { status: 404 }
      );
    }

    // Verify the meal belongs to the user
    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        userId: user.id,
      },
    });

    if (!meal) {
      return NextResponse.json(
        {
          ok: false,
          message: "Meal not found or does not belong to user",
        },
        { status: 404 }
      );
    }

    // Delete the meal (cascade will delete items)
    await prisma.meal.delete({
      where: { id: mealId },
    });

    return NextResponse.json({
      ok: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error("Delete meal route error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while deleting the meal",
      },
      { status: 500 }
    );
  }
}