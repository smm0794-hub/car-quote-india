"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, ArrowRight } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Garuda Arena GM (Rajesh Nair)",
    email: "gm@garuda-arena.in",
    role: "GM",
  },
  {
    label: "Kalyani Auto GM (Suresh Gowda)",
    email: "gm@kalyani-auto.in",
    role: "GM",
  },
  {
    label: "Bimal Cars GM (Ananya Rao)",
    email: "gm@bimal-cars.in",
    role: "GM",
  },
  {
    label: "Garuda Sales Rep (Vikram Shetty)",
    email: "vikram@garuda-arena.in",
    role: "SALES_REP",
  },
];

export default function DealerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("gm@garuda-arena.in");
  const [password, setPassword] = useState("dealer123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/dealer/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }
    router.push("/dealer/dashboard");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-slate-900 p-2 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Dealership Admin & Sales Portal
            </h1>
            <p className="text-xs text-slate-500">
              GM-governed access with instant staff revocation
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Dealership Corporate Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Verifying Access..." : "Sign In to Dealer Console"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Quick Demo Credentials (Password: dealer123)
          </p>
          <div className="mt-2.5 grid gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("dealer123");
                }}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-800">{acc.label}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
