import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDealerSessionFromCookies } from "@/lib/auth";
import { triggerDealerPayout } from "@/lib/razorpay";

const lockSchema = z.object({
  action: z.enum(["BUYER_APPROVE", "GM_APPROVE"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  const { quoteId } = await context.params;
  const body = await req.json();
  const parsed = lockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      quoteRequest: { include: { dealLock: true } },
      dealership: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (parsed.data.action === "BUYER_APPROVE") {
    if (quote.quoteRequest.dealLock) {
      return NextResponse.json(
        { error: "A quote has already been selected for this request." },
        { status: 400 }
      );
    }

    const certificateCode = `CQI-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day quote validity

    const [dealLock] = await prisma.$transaction([
      prisma.dealLock.create({
        data: {
          quoteRequestId: quote.quoteRequestId,
          winningQuoteId: quote.id,
          validUntil,
          certificateCode,
          payoutAmountInr: 900,
          platformFeeInr: 100,
          payoutStatus: "PENDING",
        },
      }),
      prisma.quote.update({
        where: { id: quote.id },
        data: { status: "BUYER_APPROVED" },
      }),
    ]);

    return NextResponse.json({
      dealLock,
      message: "Buyer approved! Awaiting Dealership GM confirmation to unlock contacts & ₹900 payout.",
    });
  }

  // GM_APPROVE: Requires GM authentication for the winning dealership
  const auth = await getDealerSessionFromCookies("GM");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.staff.dealershipId !== quote.dealershipId) {
    return NextResponse.json(
      { error: "You can only approve quotes for your own dealership." },
      { status: 403 }
    );
  }

  const existingLock = quote.quoteRequest.dealLock;
  if (!existingLock || existingLock.winningQuoteId !== quote.id) {
    return NextResponse.json(
      { error: "Buyer has not selected this quote yet." },
      { status: 400 }
    );
  }

  if (existingLock.gmApprovedAt) {
    return NextResponse.json({ dealLock: existingLock, alreadyLocked: true });
  }

  // Trigger ₹900 UPI/NEFT settlement to dealership within 24 hours
  const payout = await triggerDealerPayout(
    quote.dealership.upiOrBankAccount,
    quote.quoteRequest.depositAmountInr
  );

  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [updatedLock] = await prisma.$transaction([
    prisma.dealLock.update({
      where: { id: existingLock.id },
      data: {
        gmApprovedAt: new Date(),
        validUntil,
        payoutStatus: payout.status,
        payoutRefId: payout.payoutRefId,
      },
    }),
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: "LOCKED" },
    }),
    prisma.quoteRequest.update({
      where: { id: quote.quoteRequestId },
      data: { status: "LOCKED", depositStatus: "SETTLED" },
    }),
  ]);

  return NextResponse.json({
    dealLock: updatedLock,
    payout,
    message: "Deal mutually locked! Contacts unlocked & ₹900 UPI payout initiated.",
  });
}
