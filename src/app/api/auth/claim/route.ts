import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { claimProfileSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = claimProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { anonymousToken } = parsed.data;

  const profile = await db.userProfile.findUnique({
    where: { anonymousToken },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.userId) {
    return NextResponse.json(
      { error: "Profile already claimed" },
      { status: 409 }
    );
  }

  const updated = await db.userProfile.update({
    where: { id: profile.id },
    data: { userId: session.user.id },
  });

  return NextResponse.json({ profileId: updated.id });
}
