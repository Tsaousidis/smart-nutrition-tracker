import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveMealSchema } from "@/lib/validators";

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