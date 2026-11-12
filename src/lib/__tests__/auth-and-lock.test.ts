import { describe, it, expect } from "vitest";
import { prisma } from "../db";
import { signDealerToken, authenticateDealerStaff } from "../auth";
import { triggerDealerPayout } from "../razorpay";

describe("Dealership Staff Revocation & ₹900/₹100 Settlement", () => {
  it("blocks a sales rep immediately after GM revokes their active status", async () => {
    const rep = await prisma.dealershipStaff.findFirst({
      where: { role: "SALES_REP", isActive: true },
    });
    expect(rep).not.toBeNull();
    if (!rep) return;

    const token = await signDealerToken({
      staffId: rep.id,
      dealershipId: rep.dealershipId,
      role: "SALES_REP",
      email: rep.email,
    });

    // 1. Active rep succeeds
    const before = await authenticateDealerStaff(token);
    expect(before.ok).toBe(true);

    // 2. GM revokes rep in DB
    await prisma.dealershipStaff.update({
      where: { id: rep.id },
      data: { isActive: false, revokedAt: new Date() },
    });

    // 3. Same JWT is now rejected immediately with 403
    const after = await authenticateDealerStaff(token);
    expect(after.ok).toBe(false);
    if (!after.ok) {
      expect(after.status).toBe(403);
    }

    // Restore for clean seed state
    await prisma.dealershipStaff.update({
      where: { id: rep.id },
      data: { isActive: true, revokedAt: null },
    });
  });

  it("splits ₹1,000 commitment fee into ₹900 dealer payout and ₹100 platform fee", async () => {
    const payout = await triggerDealerPayout("garuda.arena@okicici", 1000);
    expect(payout.amountInr).toBe(900);
    expect(payout.platformFeeInr).toBe(100);
    expect(payout.status).toBe("PAID_UPI_NEFT");
  });
});
