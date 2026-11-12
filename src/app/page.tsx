import Link from "next/link";
import { ShieldCheck, Clock, IndianRupee, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentRfqs = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      vehicle: true,
      _count: { select: { quotes: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Reverse-Auction New Car Marketplace
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Same Car. Multiple Dealers. Transparent On-Road Quotes.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Stop calling ten showrooms or getting spammed by lead brokers. Submit one
            verified request and let authorized dealerships compete on{" "}
            <strong className="text-slate-900">
              cash discounts, realistic insurance, ready-yard delivery, and older-lot clearance
            </strong>{" "}
            within 48 hours.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/buyer/request"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Dealer Quotes (₹1,000 Lock)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dealer/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4 text-slate-600" />
              Dealership GM Login
            </Link>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="mt-10 grid gap-5 border-t border-slate-100 pt-8 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5 text-teal-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Zero Phone Spam</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Your phone number stays 100% masked for 48 hours. Revealed only when you
                and the dealer GM lock the winning quote.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">90% Redeemed at Booking</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Pay ₹1,000 to filter serious intent. Upon mutual lock, ₹900 is paid to
                the dealer via UPI/NEFT and deducted from your car price.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">7-Day GM Price Guarantee</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Every quote is itemized (zero illegal handling fees) and backed by a
                GM-signed 7-day price-lock certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Requests */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Buyer Quote Requests (Live Sandbox)
            </h2>
            <p className="text-sm text-slate-500">
              Click any request below to inspect competing dealer quotes and lock a deal.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {recentRfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/buyer/rfq/${rfq.id}`}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    RTO: {rfq.rtoCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      rfq.status === "LOCKED"
                        ? "bg-teal-50 text-teal-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {rfq.status}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-teal-700">
                  {rfq.vehicle.make} {rfq.vehicle.model} {rfq.vehicle.variant}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Color: {rfq.preferredColor} • Ex-Showroom:{" "}
                  {formatINR(rfq.vehicle.exShowroomPriceInr)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                <span className="text-slate-700">
                  {rfq._count.quotes} Dealer Quote{rfq._count.quotes === 1 ? "" : "s"} Received
                </span>
                <span className="inline-flex items-center gap-1 text-teal-700">
                  Compare Quotes <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
