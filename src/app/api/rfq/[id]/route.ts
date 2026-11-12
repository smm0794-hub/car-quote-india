import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rfq = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      vehicle: true,
      dealLock: true,
      quotes: {
        orderBy: { totalOnRoadPriceInr: "asc" },
        include: {
          dealership: {
            select: {
              id: true,
              legalName: true,
              brand: true,
              city: true,
              rating: true,
              // Showroom address & phone only revealed once mutually locked
              address: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!rfq) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }

  const isMutuallyLocked = Boolean(rfq.dealLock && rfq.dealLock.gmApprovedAt);

  const quotes = rfq.quotes.map((q, index) => {
    const isWinner = rfq.dealLock?.winningQuoteId === q.id;
    return {
      ...q,
      // Mask dealership identity/phone during open bidding unless mutually locked
      dealership: {
        id: q.dealership.id,
        displayName:
          isMutuallyLocked && isWinner
            ? q.dealership.legalName
            : `Verified ${q.dealership.brand} Dealer #${index + 1} (${q.dealership.city})`,
        city: q.dealership.city,
        rating: q.dealership.rating,
        address: isMutuallyLocked && isWinner ? q.dealership.address : null,
        phone: isMutuallyLocked && isWinner ? q.dealership.phone : null,
      },
    };
  });

  return NextResponse.json({
    rfq: {
      ...rfq,
      quotes,
    },
  });
}
