import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  DEALER_COOKIE_NAME,
  getDealerSessionFromCookies,
  signDealerToken,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function GET() {
  const auth = await getDealerSessionFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    staff: {
      id: auth.staff.id,
      fullName: auth.staff.fullName,
      email: auth.staff.email,
      role: auth.staff.role,
      dealership: auth.staff.dealership,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
    }

    const staff = await prisma.dealershipStaff.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
      include: { dealership: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!staff.isActive || staff.revokedAt) {
      return NextResponse.json(
        { error: "Your dealership access has been revoked by the General Manager." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(parsed.data.password, staff.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signDealerToken({
      staffId: staff.id,
      dealershipId: staff.dealershipId,
      role: staff.role === "GM" ? "GM" : "SALES_REP",
      email: staff.email,
    });

    const res = NextResponse.json({
      staff: {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        dealership: staff.dealership,
      },
    });

    res.cookies.set(DEALER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEALER_COOKIE_NAME);
  return res;
}
