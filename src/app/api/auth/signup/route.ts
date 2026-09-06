import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UNIQUE_VIOLATION, prismaErrorCode, readJsonBody } from "@/lib/api-errors";
import { findUserByEmail, normalizeEmail } from "@/lib/user-lookup";
import { signupSchema } from "@/lib/validation";

const emailTaken = () =>
  NextResponse.json({ error: "Email already registered" }, { status: 409 });

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = signupSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { password, name } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const existing = await findUserByEmail(email);
  if (existing) return emailTaken();

  const passwordHash = await bcrypt.hash(password, 12);

  // The check above is advisory only — two concurrent signups both pass it and
  // Postgres rejects the loser. That is the intended 409, not a server fault.
  try {
    const user = await db.user.create({ data: { email, passwordHash, name } });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    if (prismaErrorCode(err) === UNIQUE_VIOLATION) return emailTaken();
    throw err;
  }
}
