import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "car-quote-india-mvp-dev-secret-key-32chars"
);

export const DEALER_COOKIE_NAME = "cqi_dealer_token";

export interface DealerSessionPayload {
  staffId: string;
  dealershipId: string;
  role: "GM" | "SALES_REP";
  email: string;
}

export async function signDealerToken(payload: DealerSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyDealerToken(token: string): Promise<DealerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      staffId: String(payload.staffId),
      dealershipId: String(payload.dealershipId),
      role: payload.role === "GM" ? "GM" : "SALES_REP",
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

/**
 * Validates JWT AND checks DealershipStaff.isActive + Dealership.status in real time.
 * Ensures a revoked sales rep loses access immediately even with a valid JWT.
 */
export async function authenticateDealerStaff(
  token: string | undefined,
  requiredRole?: "GM"
) {
  if (!token) {
    return { ok: false as const, status: 401, error: "Authentication required" };
  }

  const decoded = await verifyDealerToken(token);
  if (!decoded) {
    return { ok: false as const, status: 401, error: "Invalid or expired token" };
  }

  const staff = await prisma.dealershipStaff.findUnique({
    where: { id: decoded.staffId },
    include: { dealership: true },
  });

  if (!staff || !staff.isActive || staff.revokedAt) {
    return {
      ok: false as const,
      status: 403,
      error: "Access revoked. Contact your Dealership General Manager.",
    };
  }

  if (staff.dealership.status !== "ACTIVE") {
    return {
      ok: false as const,
      status: 403,
      error: "Dealership account is currently suspended.",
    };
  }

  if (requiredRole && staff.role !== requiredRole) {
    return {
      ok: false as const,
      status: 403,
      error: "General Manager (GM) privileges required for this action.",
    };
  }

  return { ok: true as const, staff };
}

export async function getDealerSessionFromCookies(requiredRole?: "GM") {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEALER_COOKIE_NAME)?.value;
  return authenticateDealerStaff(token, requiredRole);
}
