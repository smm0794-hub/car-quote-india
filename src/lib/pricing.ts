export interface OnRoadCalculationInput {
  exShowroomInr: number;
  rtoRatePercent: number;
  cashDiscountInr?: number;
  exchangeBonusInr?: number;
  insurancePriceInr: number;
  accessoriesCostInr?: number;
  fastagAndMiscInr?: number;
  handlingChargesInr?: number;
}

export interface OnRoadBreakdown {
  exShowroomInr: number;
  rtoChargesInr: number;
  cashDiscountInr: number;
  exchangeBonusInr: number;
  insurancePriceInr: number;
  accessoriesCostInr: number;
  fastagAndMiscInr: number;
  tcsInr: number;
  totalOnRoadPriceInr: number;
}

/**
 * Standardized Indian On-Road Price calculation:
 * On-Road = (Ex-Showroom - Cash Discount - Exchange Bonus) + RTO + Insurance + TCS (1% if > ₹10L) + Fastag + Accessories.
 * Prohibits illegal Handling / Logistics charges.
 */
export function calculateOnRoadPrice(input: OnRoadCalculationInput): OnRoadBreakdown {
  if (input.handlingChargesInr && input.handlingChargesInr > 0) {
    throw new Error(
      "Handling / Logistics charges are prohibited on this platform per RTO guidelines."
    );
  }

  const cashDiscountInr = Math.max(0, Math.round(input.cashDiscountInr ?? 0));
  const exchangeBonusInr = Math.max(0, Math.round(input.exchangeBonusInr ?? 0));
  const insurancePriceInr = Math.max(0, Math.round(input.insurancePriceInr));
  const accessoriesCostInr = Math.max(0, Math.round(input.accessoriesCostInr ?? 0));
  const fastagAndMiscInr = Math.max(0, Math.round(input.fastagAndMiscInr ?? 600));

  const discountedExShowroom = Math.max(
    0,
    input.exShowroomInr - cashDiscountInr - exchangeBonusInr
  );

  // RTO is calculated on official Ex-Showroom price in Indian states
  const rtoChargesInr = Math.round((input.exShowroomInr * input.rtoRatePercent) / 100);

  // TCS 1% applies when vehicle value exceeds ₹10,00,000
  const tcsInr = discountedExShowroom > 1_000_000 ? Math.round(discountedExShowroom * 0.01) : 0;

  const totalOnRoadPriceInr =
    discountedExShowroom +
    rtoChargesInr +
    insurancePriceInr +
    tcsInr +
    fastagAndMiscInr +
    accessoriesCostInr;

  return {
    exShowroomInr: input.exShowroomInr,
    rtoChargesInr,
    cashDiscountInr,
    exchangeBonusInr,
    insurancePriceInr,
    accessoriesCostInr,
    fastagAndMiscInr,
    tcsInr,
    totalOnRoadPriceInr,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
