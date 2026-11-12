import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDealerSessionFromCookies } from "@/lib/auth";

const patchSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getDealerSessionFromCookies("GM");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (id === auth.staff.id) {
    return NextResponse.json(
      { error: "GM cannot revoke their own master account." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const target = await prisma.dealershipStaff.findUnique({ where: { id } });
  if (!target || target.dealershipId !== auth.staff.dealershipId) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const updated = await prisma.dealershipStaff.update({
    where: { id },
    data: {
      isActive: parsed.data.isActive,
      revokedAt: parsed.data.isActive ? null : new Date(),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({ staff: updated });
}
