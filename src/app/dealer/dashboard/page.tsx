"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  FileSpreadsheet,
  LogOut,
  CheckCircle2,
  UserX,
  UserPlus,
  Lock,
  Phone,
  IndianRupee,
} from "lucide-react";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: "GM" | "SALES_REP";
  isActive: boolean;
  revokedAt: string | null;
}

interface DealerSession {
  id: string;
  fullName: string;
  email: string;
  role: "GM" | "SALES_REP";
  dealership: {
    id: string;
    legalName: string;
    brand: string;
    city: string;
    upiOrBankAccount: string;
  };
}

interface DealerRfq {
  id: string;
  rtoCode: string;
  preferredColor: string;
  exchangeCarDetails: string | null;
  depositAmountInr: number;
  status: string;
  expiresAt: string;
  vehicle: {
    make: string;
    model: string;
    variant: string;
    exShowroomPriceInr: number;
    rtoRatePercent: number;
  };
  myQuotes: Array<{
    id: string;
    totalOnRoadPriceInr: number;
    guaranteedDeliveryDays: number;
    manufacturingYear: number;
    status: string;
  }>;
  dealLock: {
    id: string;
    winningQuoteId: string;
    gmApprovedAt: string | null;
    payoutStatus: string;
    payoutAmountInr: number;
    payoutRefId: string | null;
    certificateCode: string;
  } | null;
  buyerContact: {
    name: string;
    phone: string;
    email: string;
  } | null;
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function DealerDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DealerSession | null>(null);
  const [rfqs, setRfqs] = useState<DealerRfq[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [activeTab, setActiveTab] = useState<"rfqs" | "staff">("rfqs");
  const [selectedRfq, setSelectedRfq] = useState<DealerRfq | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Quote Form State
  const [cashDiscountInr, setCashDiscountInr] = useState(25000);
  const [exchangeBonusInr, setExchangeBonusInr] = useState(15000);
  const [insurancePriceInr, setInsurancePriceInr] = useState(38000);
  const [accessoriesCostInr, setAccessoriesCostInr] = useState(0);
  const [accessoriesList, setAccessoriesList] = useState("Complimentary Floor Mats & Mud Flaps");
  const [manufacturingYear, setManufacturingYear] = useState(2026);
  const [guaranteedDeliveryDays, setGuaranteedDeliveryDays] = useState(7);
  const [notes, setNotes] = useState("");

  // New Staff Form (GM Only)
  const [newRepName, setNewRepName] = useState("");
  const [newRepEmail, setNewRepEmail] = useState("");
  const [newRepPassword, setNewRepPassword] = useState("dealer123");

  const loadDashboard = useCallback(async () => {
    const authRes = await fetch("/api/dealer/auth/login");
    if (!authRes.ok) {
      router.push("/dealer/login");
      return;
    }
    const authData = await authRes.json();
    setSession(authData.staff);

    const rfqRes = await fetch("/api/rfq");
    if (rfqRes.ok) {
      const rfqData = await rfqRes.json();
      setRfqs(rfqData.rfqs || []);
    }

    if (authData.staff.role === "GM") {
      const staffRes = await fetch("/api/dealer/staff");
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || []);
      }
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    await fetch("/api/dealer/auth/login", { method: "DELETE" });
    router.push("/dealer/login");
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRfq) return;
    setErrorMsg("");
    setStatusMsg("");

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteRequestId: selectedRfq.id,
        cashDiscountInr: Number(cashDiscountInr),
        exchangeBonusInr: Number(exchangeBonusInr),
        insurancePriceInr: Number(insurancePriceInr),
        accessoriesCostInr: Number(accessoriesCostInr),
        accessoriesList,
        manufacturingYear: Number(manufacturingYear),
        guaranteedDeliveryDays: Number(guaranteedDeliveryDays),
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to submit quote");
      return;
    }
    setStatusMsg(
      `Quote submitted! Standardized On-Road Price: ${inr(data.quote.totalOnRoadPriceInr)}`
    );
    setSelectedRfq(null);
    await loadDashboard();
  }

  async function handleGmApproveDeal(quoteId: string) {
    setErrorMsg("");
    setStatusMsg("");
    const res = await fetch(`/api/deals/${quoteId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "GM_APPROVE" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to approve deal lock");
      return;
    }
    setStatusMsg(data.message);
    await loadDashboard();
  }

  async function handleAddRep(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    const res = await fetch("/api/dealer/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: newRepName,
        email: newRepEmail,
        password: newRepPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to create sales rep");
      return;
    }
    setStatusMsg(`Provisioned Sales Rep: ${data.staff.fullName}`);
    setNewRepName("");
    setNewRepEmail("");
    await loadDashboard();
  }

  async function handleToggleRep(id: string, nextActive: boolean) {
    setErrorMsg("");
    setStatusMsg("");
    const res = await fetch(`/api/dealer/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to update staff status");
      return;
    }
    setStatusMsg(
      nextActive
        ? `Restored access for ${data.staff.fullName}`
        : `Revoked access immediately for ${data.staff.fullName}`
    );
    await loadDashboard();
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 text-sm text-slate-500">
        Verifying dealership session...
      </div>
    );
  }

  // Live preview calculation for quote form
  const previewOnRoad = selectedRfq
    ? (() => {
        const discounted = Math.max(
          0,
          selectedRfq.vehicle.exShowroomPriceInr - cashDiscountInr - exchangeBonusInr
        );
        const rto = Math.round(
          (selectedRfq.vehicle.exShowroomPriceInr * selectedRfq.vehicle.rtoRatePercent) /
            100
        );
        const tcs = discounted > 1_000_000 ? Math.round(discounted * 0.01) : 0;
        return discounted + rto + insurancePriceInr + tcs + 600 + accessoriesCostInr;
      })()
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Dealer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
              {session.role}
            </span>
            <span className="text-xs font-semibold text-teal-700">
              {session.dealership.brand} • {session.dealership.city}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-slate-900">
            {session.dealership.legalName}
          </h1>
          <p className="text-xs text-slate-500">
            Signed in as {session.fullName} ({session.email}) • Settlement UPI:{" "}
            <strong className="text-slate-700">{session.dealership.upiOrBankAccount}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
              activeTab === "rfqs"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Quote Requests ({rfqs.length})
          </button>
          {session.role === "GM" && (
            <button
              onClick={() => setActiveTab("staff")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                activeTab === "staff"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              <Users className="h-4 w-4" />
              Staff Access ({staffList.length})
            </button>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: RFQs & Quote Submission */}
      {activeTab === "rfqs" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {rfqs.map((r) => {
              const myWinningQuote = r.myQuotes.find(
                (q) => q.id === r.dealLock?.winningQuoteId
              );
              const needsGmApproval =
                myWinningQuote && r.dealLock && !r.dealLock.gmApprovedAt;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          RTO: {r.rtoCode}
                        </span>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                          ₹{r.depositAmountInr} Verified Buyer
                        </span>
                        {!r.buyerContact && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            <Lock className="h-3 w-3" /> Contact Masked
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-base font-extrabold text-slate-900">
                        {r.vehicle.make} {r.vehicle.model} {r.vehicle.variant}
                      </h2>
                      <p className="text-xs text-slate-600">
                        Colour: <strong>{r.preferredColor}</strong> • Ex-Showroom:{" "}
                        {inr(r.vehicle.exShowroomPriceInr)}
                        {r.exchangeCarDetails
                          ? ` • Exchange: ${r.exchangeCarDetails}`
                          : ""}
                      </p>
                    </div>

                    {r.status === "OPEN" && (
                      <button
                        onClick={() => setSelectedRfq(r)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        {r.myQuotes.length > 0 ? "Submit Revised Quote" : "Submit OTD Quote"}
                      </button>
                    )}
                  </div>

                  {/* My Submitted Quotes */}
                  {r.myQuotes.length > 0 && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs">
                      <p className="font-bold text-slate-700">
                        Your Showroom&apos;s Submitted Quote(s):
                      </p>
                      {r.myQuotes.map((q) => (
                        <div
                          key={q.id}
                          className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-1.5"
                        >
                          <span>
                            On-Road: <strong>{inr(q.totalOnRoadPriceInr)}</strong> •{" "}
                            {q.guaranteedDeliveryDays}d delivery • MY{q.manufacturingYear}
                          </span>
                          <span className="font-bold text-teal-700">{q.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* GM Approval Required Banner */}
                  {needsGmApproval && myWinningQuote && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                      <div>
                        <p className="text-xs font-extrabold text-amber-900">
                          BUYER SELECTED YOUR QUOTE!
                        </p>
                        <p className="text-xs text-amber-800">
                          GM approval locks the 7-day price guarantee, unlocks buyer
                          phone, and triggers ₹900 UPI payout.
                        </p>
                      </div>
                      {session.role === "GM" ? (
                        <button
                          onClick={() => handleGmApproveDeal(myWinningQuote.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          GM Approve & Claim ₹900 UPI
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-amber-900">
                          Awaiting your GM&apos;s sign-off
                        </span>
                      )}
                    </div>
                  )}

                  {/* Unlocked Buyer Contact */}
                  {r.buyerContact && r.dealLock && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs">
                      <div>
                        <p className="font-extrabold text-teal-900">
                          DEAL LOCKED • Certificate {r.dealLock.certificateCode}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-teal-900">
                          <Phone className="h-3.5 w-3.5" />
                          <strong>{r.buyerContact.name}</strong> • {r.buyerContact.phone}{" "}
                          • {r.buyerContact.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-teal-800">
                        <IndianRupee className="h-4 w-4" />
                        ₹{r.dealLock.payoutAmountInr} {r.dealLock.payoutStatus}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Fast-Quote Entry Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit sticky top-20">
            <h2 className="text-base font-extrabold text-slate-900">
              Standardized OTD Quote Builder
            </h2>
            {!selectedRfq ? (
              <p className="mt-2 text-xs text-slate-500">
                Select an open RFQ on the left to submit an itemized On-Road price quote.
                Handling/logistics charges are strictly prohibited.
              </p>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="mt-4 space-y-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-bold text-slate-900">
                    {selectedRfq.vehicle.make} {selectedRfq.vehicle.model}{" "}
                    {selectedRfq.vehicle.variant}
                  </p>
                  <p className="text-slate-500">
                    Ex-Showroom: {inr(selectedRfq.vehicle.exShowroomPriceInr)} • RTO{" "}
                    {selectedRfq.vehicle.rtoRatePercent}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Cash Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cashDiscountInr}
                      onChange={(e) => setCashDiscountInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Exchange Bonus (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={exchangeBonusInr}
                      onChange={(e) => setExchangeBonusInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Insurance Price (₹)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      value={insurancePriceInr}
                      onChange={(e) => setInsurancePriceInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Accessories Cost (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={accessoriesCostInr}
                      onChange={(e) => setAccessoriesCostInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Mfg Year (MY)
                    </label>
                    <input
                      type="number"
                      min={2024}
                      max={2027}
                      value={manufacturingYear}
                      onChange={(e) => setManufacturingYear(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Delivery (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={guaranteedDeliveryDays}
                      onChange={(e) => setGuaranteedDeliveryDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Accessories Included
                  </label>
                  <input
                    type="text"
                    value={accessoriesList}
                    onChange={(e) => setAccessoriesList(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Showroom Notes (Yard Stock / Color)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Ready in Whitefield yard"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="rounded-xl bg-slate-900 p-3.5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase text-slate-300">
                      Calculated On-Road
                    </span>
                    <span className="text-lg font-extrabold">{inr(previewOnRoad)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-teal-700 py-2.5 font-bold text-white hover:bg-teal-800"
                  >
                    Submit Binding Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRfq(null)}
                    className="rounded-xl border border-slate-300 px-3 py-2.5 font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GM Staff Access Control */}
      {activeTab === "staff" && session.role === "GM" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Dealership Staff Roster (GM Governed)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Revoking a sales consultant immediately invalidates their active session and
              blocks all quote access.
            </p>

            <div className="mt-4 divide-y divide-slate-100">
              {staffList.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {s.fullName}{" "}
                      <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {s.role}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        s.isActive
                          ? "bg-teal-50 text-teal-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {s.isActive ? "ACTIVE" : "REVOKED"}
                    </span>
                    {s.role !== "GM" && (
                      <button
                        onClick={() => handleToggleRep(s.id, !s.isActive)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${
                          s.isActive
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                        }`}
                      >
                        {s.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Revoke Access
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Restore Access
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Sales Rep Form */}
          <form
            onSubmit={handleAddRep}
            className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3"
          >
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <UserPlus className="h-4 w-4 text-teal-700" />
              Provision Sales Consultant
            </h3>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Full Name
              </label>
              <input
                required
                type="text"
                placeholder="Arjun Mehta"
                value={newRepName}
                onChange={(e) => setNewRepName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Corporate Email
              </label>
              <input
                required
                type="email"
                placeholder="arjun@garuda-arena.in"
                value={newRepEmail}
                onChange={(e) => setNewRepEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Initial Password
              </label>
              <input
                required
                type="text"
                value={newRepPassword}
                onChange={(e) => setNewRepPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Create Sales Rep Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
