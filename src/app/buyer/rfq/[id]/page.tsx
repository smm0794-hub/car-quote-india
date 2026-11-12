"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Sparkles,
  Award,
  RefreshCw,
} from "lucide-react";

interface QuoteItem {
  id: string;
  exShowroomInr: number;
  rtoChargesInr: number;
  cashDiscountInr: number;
  exchangeBonusInr: number;
  insurancePriceInr: number;
  accessoriesCostInr: number;
  accessoriesList: string;
  fastagAndMiscInr: number;
  tcsInr: number;
  totalOnRoadPriceInr: number;
  manufacturingYear: number;
  guaranteedDeliveryDays: number;
  notes: string | null;
  status: string;
  dealership: {
    id: string;
    displayName: string;
    city: string;
    rating: number;
    address: string | null;
    phone: string | null;
  };
}

interface RfqDetail {
  id: string;
  rtoCode: string;
  preferredColor: string;
  exchangeCarDetails: string | null;
  depositAmountInr: number;
  depositStatus: string;
  status: string;
  expiresAt: string;
  vehicle: {
    make: string;
    model: string;
    variant: string;
    fuelType: string;
    transmission: string;
    exShowroomPriceInr: number;
  };
  quotes: QuoteItem[];
  dealLock: {
    id: string;
    winningQuoteId: string;
    buyerApprovedAt: string;
    gmApprovedAt: string | null;
    validUntil: string;
    payoutAmountInr: number;
    platformFeeInr: number;
    payoutStatus: string;
    payoutRefId: string | null;
    certificateCode: string;
  } | null;
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function BuyerRfqComparisonPage() {
  const params = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadRfq = useCallback(async () => {
    const res = await fetch(`/api/rfq/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setRfq(data.rfq);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadRfq();
  }, [loadRfq]);

  async function handleBuyerApprove(quoteId: string) {
    setLockingId(quoteId);
    setMessage("");
    const res = await fetch(`/api/deals/${quoteId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "BUYER_APPROVE" }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      await loadRfq();
    } else {
      setMessage(data.error || "Could not select quote");
    }
    setLockingId(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 text-sm text-slate-500">
        Loading competing dealer quotes...
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 text-sm text-red-600">
        Quote request not found.
      </div>
    );
  }

  const hoursLeft = Math.max(
    0,
    Math.round((new Date(rfq.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const lowestPrice = rfq.quotes[0]?.totalOnRoadPriceInr;
  const fastestDays = rfq.quotes.reduce(
    (min, q) => Math.min(min, q.guaranteedDeliveryDays),
    999
  );
  const isMutuallyLocked = Boolean(rfq.dealLock?.gmApprovedAt);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
              RTO {rfq.rtoCode}
            </span>
            <span className="rounded bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              ₹{rfq.depositAmountInr} Escrow: {rfq.depositStatus}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5" />
              {hoursLeft}h remaining in 48h window
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            {rfq.vehicle.make} {rfq.vehicle.model} {rfq.vehicle.variant}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Preferred Colour: <strong>{rfq.preferredColor}</strong> • Ex-Showroom:{" "}
            <strong>{inr(rfq.vehicle.exShowroomPriceInr)}</strong>
            {rfq.exchangeCarDetails ? ` • Exchange: ${rfq.exchangeCarDetails}` : ""}
          </p>
        </div>

        <button
          onClick={loadRfq}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Quotes
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
          {message}
        </div>
      )}

      {/* Deal Lock Status Banner */}
      {rfq.dealLock && (
        <div className="mt-6 rounded-2xl border border-teal-300 bg-teal-50/70 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold text-teal-900">
                <Award className="h-5 w-5 text-teal-700" />
                {isMutuallyLocked
                  ? "DEAL MUTUALLY LOCKED — 7-DAY GM PRICE GUARANTEE ACTIVE"
                  : "QUOTE SELECTED — AWAITING DEALERSHIP GM FINAL CONFIRMATION"}
              </div>
              <p className="mt-1 text-xs text-teal-800">
                Certificate Code:{" "}
                <strong className="font-mono text-sm">{rfq.dealLock.certificateCode}</strong>{" "}
                • Valid Until:{" "}
                <strong>
                  {new Date(rfq.dealLock.validUntil).toLocaleDateString("en-IN")}
                </strong>
              </p>
              <p className="mt-1 text-xs text-teal-800">
                ₹{rfq.dealLock.payoutAmountInr} Booking Credit Status:{" "}
                <strong>{rfq.dealLock.payoutStatus}</strong>
                {rfq.dealLock.payoutRefId ? ` (${rfq.dealLock.payoutRefId})` : ""}
              </p>
            </div>

            {isMutuallyLocked &&
              (() => {
                const winner = rfq.quotes.find(
                  (q) => q.id === rfq.dealLock?.winningQuoteId
                );
                if (!winner) return null;
                return (
                  <div className="rounded-xl border border-teal-200 bg-white p-4 text-xs">
                    <p className="font-bold text-slate-900">
                      {winner.dealership.displayName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-teal-700" />
                      {winner.dealership.address}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                      <Phone className="h-3.5 w-3.5 text-teal-700" />
                      {winner.dealership.phone}
                    </p>
                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* Competing Quotes Grid */}
      <h2 className="mt-8 text-lg font-bold text-slate-900">
        Competing Dealer Quotes ({rfq.quotes.length})
      </h2>

      {rfq.quotes.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No dealer quotes submitted yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Authorized dealerships have 48 hours to inspect yard inventory and submit
            their best itemized On-Road price.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {rfq.quotes.map((q) => {
            const isLowest = q.totalOnRoadPriceInr === lowestPrice;
            const isFastest = q.guaranteedDeliveryDays === fastestDays;
            const isWinner = rfq.dealLock?.winningQuoteId === q.id;

            return (
              <div
                key={q.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${
                  isWinner
                    ? "border-teal-600 ring-2 ring-teal-600/20"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {q.dealership.displayName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Rating: ★ {q.dealership.rating.toFixed(1)} • Zero Handling Fee
                        Verified
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {isLowest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                          <Sparkles className="h-3 w-3" /> Lowest On-Road
                        </span>
                      )}
                      {isFastest && q.guaranteedDeliveryDays <= 7 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          Ready Stock ({q.guaranteedDeliveryDays}d)
                        </span>
                      )}
                      {q.manufacturingYear < 2026 && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          MY{q.manufacturingYear} Lot Clearance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total On-Road Banner */}
                  <div className="mt-4 flex items-baseline justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Final On-Road Price
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900">
                      {inr(q.totalOnRoadPriceInr)}
                    </span>
                  </div>

                  {/* Itemized Breakdown */}
                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <dt>Ex-Showroom Price</dt>
                      <dd className="font-semibold text-slate-900">
                        {inr(q.exShowroomInr)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-teal-700">
                      <dt>Dealer Cash Discount</dt>
                      <dd className="font-bold">− {inr(q.cashDiscountInr)}</dd>
                    </div>
                    {q.exchangeBonusInr > 0 && (
                      <div className="flex justify-between text-teal-700">
                        <dt>Exchange Bonus</dt>
                        <dd className="font-bold">− {inr(q.exchangeBonusInr)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <dt>RTO & Road Tax</dt>
                      <dd className="font-semibold text-slate-900">
                        {inr(q.rtoChargesInr)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Insurance Quote</dt>
                      <dd className="font-semibold text-slate-900">
                        {inr(q.insurancePriceInr)}
                      </dd>
                    </div>
                    {q.tcsInr > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <dt>TCS (1%)</dt>
                        <dd className="font-semibold text-slate-900">{inr(q.tcsInr)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <dt>Accessories ({q.accessoriesList})</dt>
                      <dd className="font-semibold text-slate-900">
                        {q.accessoriesCostInr === 0 ? "Free" : inr(q.accessoriesCostInr)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Fastag & Misc</dt>
                      <dd className="font-semibold text-slate-900">
                        {inr(q.fastagAndMiscInr)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-700">
                      <dt>Guaranteed Delivery</dt>
                      <dd className="font-bold text-slate-900">
                        {q.guaranteedDeliveryDays} Days (MY{q.manufacturingYear})
                      </dd>
                    </div>
                  </dl>

                  {q.notes && (
                    <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs italic text-slate-600">
                      &ldquo;{q.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-2">
                  {!rfq.dealLock ? (
                    <button
                      onClick={() => handleBuyerApprove(q.id)}
                      disabled={lockingId === q.id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {lockingId === q.id
                        ? "Locking Quote..."
                        : "Select & Lock This Quote (Redeem ₹900)"}
                    </button>
                  ) : isWinner ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-teal-50 py-3 text-sm font-bold text-teal-800">
                      <CheckCircle2 className="h-4 w-4" />
                      {isMutuallyLocked
                        ? "Locked & ₹900 Paid to Dealer"
                        : "Selected — Pending Dealer GM Approval"}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-100 py-3 text-center text-xs font-semibold text-slate-500">
                      Another quote selected
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
