"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Car, ArrowRight, IndianRupee } from "lucide-react";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string;
  fuelType: string;
  transmission: string;
  exShowroomPriceInr: number;
  rtoRatePercent: number;
}

const COLORS = [
  "Pearl Arctic White",
  "Metallic Magma Grey",
  "Splendid Silver",
  "Sizzling Red",
  "Brave Khaki / Dual Tone",
  "Midnight Black",
];

const RTOS = [
  { code: "KA-01", label: "KA-01 (Bengaluru Central)" },
  { code: "KA-03", label: "KA-03 (Bengaluru East)" },
  { code: "KA-05", label: "KA-05 (Bengaluru South)" },
  { code: "DL-3C", label: "DL-3C (New Delhi South)" },
  { code: "MH-02", label: "MH-02 (Mumbai West)" },
];

export default function BuyerRequestPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleMasterId, setVehicleMasterId] = useState("");
  const [rtoCode, setRtoCode] = useState("KA-01");
  const [preferredColor, setPreferredColor] = useState(COLORS[0]);
  const [exchangeCarDetails, setExchangeCarDetails] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (d.vehicles?.length) {
          setVehicles(d.vehicles);
          setVehicleMasterId(d.vehicles[0].id);
        }
      });
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleMasterId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerEmail,
          rtoCode,
          vehicleMasterId,
          preferredColor,
          exchangeCarDetails: exchangeCarDetails.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit quote request");
        setSubmitting(false);
        return;
      }
      router.push(`/buyer/rfq/${data.rfq.id}`);
    } catch {
      setError("Network error while submitting request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
          Step 1 of 2 • Anonymous Request
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Request Competing Dealer Quotes
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Dealers receive your car spec and RTO only. Your phone number stays hidden for 48
          hours until you and the dealer GM mutually lock a deal.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Vehicle Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">
              Select Car Make, Model & Variant
            </label>
            <select
              value={vehicleMasterId}
              onChange={(e) => setVehicleMasterId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} {v.variant} ({v.fuelType} • {v.transmission}) — Ex-Showroom ₹
                  {v.exShowroomPriceInr.toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">
              Registration RTO
            </label>
            <select
              value={rtoCode}
              onChange={(e) => setRtoCode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {RTOS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">
              Preferred Colour
            </label>
            <select
              value={preferredColor}
              onChange={(e) => setPreferredColor(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">
              Old Car for Exchange (Optional — unlocks Exchange Bonus)
            </label>
            <input
              type="text"
              placeholder="e.g., 2019 Maruti Swift VXi, 45,000 km, KA-01"
              value={exchangeCarDetails}
              onChange={(e) => setExchangeCarDetails(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Masked Contact Details */}
        <div className="border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <Lock className="h-4 w-4 text-teal-700" />
            Your Contact Details (100% Masked Until Deal Lock)
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Full Name
              </label>
              <input
                required
                type="text"
                placeholder="Rohan Kulkarni"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Mobile Number
              </label>
              <input
                required
                type="tel"
                placeholder="+91 98450 00000"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="rohan@example.in"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Commitment Fee Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ₹1,000 Serious-Buyer Commitment Fee (₹900 Redeemed)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  90% (₹900) is transferred to your chosen dealer via UPI/NEFT upon
                  mutual lock and credited toward your car booking. 100% refunded if no
                  dealer quotes within 48 hours.
                </p>
              </div>
            </div>
            {selectedVehicle && (
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-slate-500">
                  Base Ex-Showroom
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  ₹{selectedVehicle.exShowroomPriceInr.toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            Sandbox Razorpay UPI/Card Escrow enabled for demo
          </div>
          <button
            type="submit"
            disabled={submitting || !vehicleMasterId}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Car className="h-4 w-4" />
            {submitting ? "Processing ₹1,000 Lock..." : "Pay ₹1,000 & Broadcast 48h RFQ"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
