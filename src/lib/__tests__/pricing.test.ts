import { describe, it, expect } from "vitest";
import { calculateOnRoadPrice } from "../pricing";

describe("calculateOnRoadPrice (India Standardized Formula)", () => {
  it("calculates On-Road price with 1% TCS when discounted ex-showroom > ₹10L", () => {
    const res = calculateOnRoadPrice({
      exShowroomInr: 1414000,
      rtoRatePercent: 14,
      cashDiscountInr: 45000,
      exchangeBonusInr: 25000,
      insurancePriceInr: 36500,
      accessoriesCostInr: 0,
      fastagAndMiscInr: 600,
    });

    // Discounted Ex-Showroom = 14,14,000 - 45,000 - 25,000 = 13,44,000
    // RTO = 14% of 14,14,000 = 1,97,960
    // TCS = 1% of 13,44,000 = 13,440
    // Total = 13,44,000 + 1,97,960 + 36,500 + 13,440 + 600 = 15,92,500
    expect(res.rtoChargesInr).toBe(197960);
    expect(res.tcsInr).toBe(13440);
    expect(res.totalOnRoadPriceInr).toBe(1592500);
  });

  it("omits TCS when discounted ex-showroom <= ₹10L", () => {
    const res = calculateOnRoadPrice({
      exShowroomInr: 950000,
      rtoRatePercent: 12,
      cashDiscountInr: 10000,
      insurancePriceInr: 25000,
    });
    expect(res.tcsInr).toBe(0);
    expect(res.rtoChargesInr).toBe(114000);
  });

  it("rejects prohibited handling / logistics charges", () => {
    expect(() =>
      calculateOnRoadPrice({
        exShowroomInr: 1200000,
        rtoRatePercent: 14,
        insurancePriceInr: 30000,
        handlingChargesInr: 8500,
      })
    ).toThrow(/prohibited/i);
  });
});
