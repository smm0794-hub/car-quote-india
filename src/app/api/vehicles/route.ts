import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const vehicles = await prisma.vehicleMaster.findMany({
    orderBy: [{ make: "asc" }, { exShowroomPriceInr: "asc" }],
  });
  return NextResponse.json({ vehicles });
}
