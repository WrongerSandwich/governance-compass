import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FOREIGN_KEY_VIOLATION, prismaErrorCode, readJsonBody } from "@/lib/api-errors";
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

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { axisId, hidden } = parsed.data;

  if (hidden) {
    try {
      await db.axisVisibility.upsert({
        where: {
          userId_axisId: { userId: session.user.id, axisId },
        },
        update: { hidden: true },
        create: { userId: session.user.id, axisId, hidden: true },
      });
    } catch (err) {
      // The schema only knows axes 1-12; anything else trips the FK, which is
      // a bad request rather than a server fault.
      if (prismaErrorCode(err) === FOREIGN_KEY_VIOLATION) {
        return NextResponse.json({ error: "Unknown axis" }, { status: 400 });
      }
      throw err;
    }
  } else {
    await db.axisVisibility.deleteMany({
      where: { userId: session.user.id, axisId },
    });
  }

  return NextResponse.json({ success: true });
}
