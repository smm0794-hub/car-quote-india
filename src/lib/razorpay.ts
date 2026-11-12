import crypto from "crypto";

export interface DepositCaptureResult {
  paymentRefId: string;
  amountInr: number;
  status: "ESCROW_HELD";
  mode: "sandbox" | "razorpay";
}

export interface PayoutResult {
  payoutRefId: string;
  dealershipUpi: string;
  amountInr: number;
  platformFeeInr: number;
  status: "PAID_UPI_NEFT";
  settledAt: string;
}

export async function captureBuyerDeposit(
  amountInr: number = 1000
): Promise<DepositCaptureResult> {
  // In production with PAYMENT_MODE="razorpay", verify Razorpay signature & capture payment.
  const id = `pay_sbx_${crypto.randomBytes(6).toString("hex")}`;
  return {
    paymentRefId: id,
    amountInr,
    status: "ESCROW_HELD",
    mode: "sandbox",
  };
}

export async function triggerDealerPayout(
  dealershipUpi: string,
  depositAmountInr: number = 1000
): Promise<PayoutResult> {
  const payoutAmountInr = Math.round(depositAmountInr * 0.9); // 90% -> ₹900
  const platformFeeInr = depositAmountInr - payoutAmountInr; // 10% -> ₹100
  const payoutRefId = `upi_sbx_${crypto.randomBytes(6).toString("hex")}`;

  return {
    payoutRefId,
    dealershipUpi,
    amountInr: payoutAmountInr,
    platformFeeInr,
    status: "PAID_UPI_NEFT",
    settledAt: new Date().toISOString(),
  };
}
