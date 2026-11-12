import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CarQuote India | Compare Real On-Road Car Quotes. Zero Spam.",
  description:
    "India's reverse-auction new car marketplace. Get transparent, itemized On-Road price quotes from competing authorized dealers in 48 hours with zero phone spam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-[#F8FAFC] text-slate-900 antialiased`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-extrabold text-white">
                CQ
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  CarQuote
                </span>
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                  India
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/buyer/request"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Request Quotes
              </Link>
              <Link
                href="/dealer/login"
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Dealer GM Portal
              </Link>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
