import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDealerSessionFromCookies } from "@/lib/auth";

const createStaffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function GET() {
  const auth = await getDealerSessionFromCookies("GM");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const staffList = await prisma.dealershipStaff.findMany({
    where: { dealershipId: auth.staff.dealershipId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ staff: staffList });
}

export async function POST(req: NextRequest) {
  const auth = await getDealerSessionFromCookies("GM");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid staff details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.dealershipStaff.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A staff account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const created = await prisma.dealershipStaff.create({
      data: {
        dealershipId: auth.staff.dealershipId,
        fullName: parsed.data.fullName,
        email,
        passwordHash,
        role: "SALES_REP",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff: created }, { status: 201 });
  } catch (err) {
    console.error("Create staff error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
