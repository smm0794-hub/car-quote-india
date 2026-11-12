import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { captureBuyerDeposit } from "@/lib/razorpay";
import { getDealerSessionFromCookies } from "@/lib/auth";

const createRfqSchema = z.object({
  buyerName: z.string().min(2),
  buyerPhone: z.string().min(10),
  buyerEmail: z.string().email(),
  rtoCode: z.string().min(4).max(10),
  vehicleMasterId: z.string().min(1),
  preferredColor: z.string().min(2),
  exchangeCarDetails: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRfqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request fields", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicleMaster.findUnique({
      where: { id: parsed.data.vehicleMasterId },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Capture ₹1,000 commitment deposit (90% redeemed on booking, 10% platform fee)
    const payment = await captureBuyerDeposit(1000);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour standard window

    const rfq = await prisma.quoteRequest.create({
      data: {
        buyerName: parsed.data.buyerName,
        buyerPhone: parsed.data.buyerPhone,
        buyerEmail: parsed.data.buyerEmail,
        rtoCode: parsed.data.rtoCode.toUpperCase(),
        vehicleMasterId: vehicle.id,
        preferredColor: parsed.data.preferredColor,
        exchangeCarDetails: parsed.data.exchangeCarDetails || null,
        depositAmountInr: payment.amountInr,
        depositStatus: payment.status,
        paymentRefId: payment.paymentRefId,
        status: "OPEN",
        expiresAt,
      },
      include: { vehicle: true },
    });

    return NextResponse.json({ rfq, payment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/rfq error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");

  // Public demo list for quick navigation on landing/buyer pages
  if (mode === "public_summary") {
    const rfqs = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rtoCode: true,
        preferredColor: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        vehicle: true,
        _count: { select: { quotes: true } },
      },
    });
    return NextResponse.json({ rfqs });
  }

  // Dealer feed: requires active dealer staff session and masks buyer PII until mutual lock
  const auth = await getDealerSessionFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rfqs = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true,
      dealLock: true,
      quotes: {
        where: { dealershipId: auth.staff.dealershipId },
      },
    },
  });

  const sanitized = rfqs.map((r) => {
    const isMutuallyLockedForThisDealer =
      r.dealLock &&
      r.dealLock.gmApprovedAt !== null &&
      r.quotes.some((q) => q.id === r.dealLock?.winningQuoteId);

    return {
      id: r.id,
      rtoCode: r.rtoCode,
      vehicle: r.vehicle,
      preferredColor: r.preferredColor,
      exchangeCarDetails: r.exchangeCarDetails,
      depositAmountInr: r.depositAmountInr,
      depositStatus: r.depositStatus,
      status: r.status,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      myQuotes: r.quotes,
      dealLock: r.dealLock,
      // Buyer contact info is strictly masked until mutual DealLock!
      buyerContact: isMutuallyLockedForThisDealer
        ? {
            name: r.buyerName,
            phone: r.buyerPhone,
            email: r.buyerEmail,
          }
        : null,
    };
  });

  return NextResponse.json({ rfqs: sanitized });
}
