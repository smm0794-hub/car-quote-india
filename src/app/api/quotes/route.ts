import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDealerSessionFromCookies } from "@/lib/auth";
import { calculateOnRoadPrice } from "@/lib/pricing";

const quoteSchema = z.object({
  quoteRequestId: z.string().min(1),
  cashDiscountInr: z.number().min(0).default(0),
  exchangeBonusInr: z.number().min(0).default(0),
  insurancePriceInr: z.number().min(1000),
  accessoriesCostInr: z.number().min(0).default(0),
  accessoriesList: z.string().default("None"),
  fastagAndMiscInr: z.number().min(0).default(600),
  handlingChargesInr: z.number().min(0).default(0),
  manufacturingYear: z.number().int().min(2024).max(2027),
  guaranteedDeliveryDays: z.number().int().min(1).max(365),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getDealerSessionFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quote payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rfq = await prisma.quoteRequest.findUnique({
      where: { id: parsed.data.quoteRequestId },
      include: { vehicle: true },
    });

    if (!rfq) {
      return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
    }
    if (rfq.status !== "OPEN" || new Date() > rfq.expiresAt) {
      return NextResponse.json(
        { error: "This 48-hour quote window is closed." },
        { status: 400 }
      );
    }

    const breakdown = calculateOnRoadPrice({
      exShowroomInr: rfq.vehicle.exShowroomPriceInr,
      rtoRatePercent: rfq.vehicle.rtoRatePercent,
      cashDiscountInr: parsed.data.cashDiscountInr,
      exchangeBonusInr: parsed.data.exchangeBonusInr,
      insurancePriceInr: parsed.data.insurancePriceInr,
      accessoriesCostInr: parsed.data.accessoriesCostInr,
      fastagAndMiscInr: parsed.data.fastagAndMiscInr,
      handlingChargesInr: parsed.data.handlingChargesInr,
    });

    const quote = await prisma.quote.create({
      data: {
        quoteRequestId: rfq.id,
        dealershipId: auth.staff.dealershipId,
        submittedByStaffId: auth.staff.id,
        ...breakdown,
        accessoriesList: parsed.data.accessoriesList,
        manufacturingYear: parsed.data.manufacturingYear,
        guaranteedDeliveryDays: parsed.data.guaranteedDeliveryDays,
        notes: parsed.data.notes || null,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit quote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
