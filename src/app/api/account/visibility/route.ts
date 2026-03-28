import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  axisId: z.number().int(),
  hidden: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { axisId, hidden } = parsed.data;

  if (hidden) {
    await db.axisVisibility.upsert({
      where: {
        userId_axisId: { userId: session.user.id, axisId },
      },
      update: { hidden: true },
      create: { userId: session.user.id, axisId, hidden: true },
    });
  } else {
    await db.axisVisibility.deleteMany({
      where: { userId: session.user.id, axisId },
    });
  }

  return NextResponse.json({ success: true });
}
