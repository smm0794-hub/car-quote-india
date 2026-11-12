import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateOnRoadPrice } from "../src/lib/pricing";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding India New Car Reverse-Auction Marketplace...");

  // Clear existing data in dependency order
  await prisma.dealLock.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.dealershipStaff.deleteMany();
  await prisma.dealership.deleteMany();
  await prisma.vehicleMaster.deleteMany();

  const passwordHash = await bcrypt.hash("dealer123", 10);

  // 1. Seed Indian Vehicle Master Catalog
  const vehicles = await Promise.all([
    prisma.vehicleMaster.create({
      data: {
        make: "Maruti Suzuki",
        model: "Brezza",
        variant: "ZXi+ AT",
        fuelType: "Petrol",
        transmission: "Automatic (6-AT)",
        exShowroomPriceInr: 1414000,
        rtoRatePercent: 14.0,
        tcsApplicable: true,
      },
    }),
    prisma.vehicleMaster.create({
      data: {
        make: "Maruti Suzuki",
        model: "Grand Vitara",
        variant: "Alpha Strong Hybrid",
        fuelType: "Hybrid",
        transmission: "e-CVT",
        exShowroomPriceInr: 1993000,
        rtoRatePercent: 17.0,
        tcsApplicable: true,
      },
    }),
    prisma.vehicleMaster.create({
      data: {
        make: "Tata",
        model: "Nexon",
        variant: "Fearless+ S DCA",
        fuelType: "Petrol",
        transmission: "7-Speed DCA",
        exShowroomPriceInr: 1480000,
        rtoRatePercent: 14.0,
        tcsApplicable: true,
      },
    }),
    prisma.vehicleMaster.create({
      data: {
        make: "Hyundai",
        model: "Creta",
        variant: "SX(O) IVT",
        fuelType: "Petrol",
        transmission: "IVT Automatic",
        exShowroomPriceInr: 1873000,
        rtoRatePercent: 17.0,
        tcsApplicable: true,
      },
    }),
    prisma.vehicleMaster.create({
      data: {
        make: "Mahindra",
        model: "XUV700",
        variant: "AX7 L Diesel AT",
        fuelType: "Diesel",
        transmission: "Automatic",
        exShowroomPriceInr: 2399000,
        rtoRatePercent: 18.0,
        tcsApplicable: true,
      },
    }),
    prisma.vehicleMaster.create({
      data: {
        make: "Kia",
        model: "Seltos",
        variant: "HTX IVT",
        fuelType: "Petrol",
        transmission: "IVT Automatic",
        exShowroomPriceInr: 1660000,
        rtoRatePercent: 17.0,
        tcsApplicable: true,
      },
    }),
  ]);

  const brezza = vehicles[0];

  // 2. Seed Competing Dealerships + GMs + Sales Reps
  const garuda = await prisma.dealership.create({
    data: {
      legalName: "Garuda Arena Motors Pvt Ltd",
      brand: "Maruti Suzuki",
      city: "Bengaluru",
      rtoCodePrefix: "KA",
      address: "100 Feet Road, Indiranagar, Bengaluru 560038",
      phone: "+91 80 4112 8800",
      gstin: "29AABCG1234F1Z5",
      upiOrBankAccount: "garuda.arena@okicici",
      rating: 4.8,
      staff: {
        create: [
          {
            fullName: "Rajesh Nair",
            email: "gm@garuda-arena.in",
            passwordHash,
            role: "GM",
            isActive: true,
          },
          {
            fullName: "Vikram Shetty",
            email: "vikram@garuda-arena.in",
            passwordHash,
            role: "SALES_REP",
            isActive: true,
          },
        ],
      },
    },
    include: { staff: true },
  });

  const kalyani = await prisma.dealership.create({
    data: {
      legalName: "Kalyani Auto Plaza LLP",
      brand: "Maruti Suzuki",
      city: "Bengaluru",
      rtoCodePrefix: "KA",
      address: "Bannerghatta Main Road, Bengaluru 560076",
      phone: "+91 80 4901 2200",
      gstin: "29AABCK5678K1Z2",
      upiOrBankAccount: "kalyani.auto@hdfcbank",
      rating: 4.6,
      staff: {
        create: [
          {
            fullName: "Suresh Gowda",
            email: "gm@kalyani-auto.in",
            passwordHash,
            role: "GM",
            isActive: true,
          },
        ],
      },
    },
    include: { staff: true },
  });

  const bimal = await prisma.dealership.create({
    data: {
      legalName: "Bimal Prestige Cars Pvt Ltd",
      brand: "Maruti Suzuki",
      city: "Bengaluru",
      rtoCodePrefix: "KA",
      address: "Mahadevapura Outer Ring Road, Bengaluru 560048",
      phone: "+91 80 4220 9900",
      gstin: "29AABCB9012M1Z9",
      upiOrBankAccount: "bimal.cars@axisbank",
      rating: 4.9,
      staff: {
        create: [
          {
            fullName: "Ananya Rao",
            email: "gm@bimal-cars.in",
            passwordHash,
            role: "GM",
            isActive: true,
          },
        ],
      },
    },
    include: { staff: true },
  });

  // 3. Seed Sample Open RFQ with 2 Competing Quotes
  const expiresAt = new Date(Date.now() + 46 * 60 * 60 * 1000); // 46h remaining
  const sampleRfq = await prisma.quoteRequest.create({
    data: {
      buyerName: "Karthik Subramanian",
      buyerPhone: "+91 98450 12345",
      buyerEmail: "karthik.s@example.in",
      rtoCode: "KA-01",
      vehicleMasterId: brezza.id,
      preferredColor: "Pearl Arctic White",
      exchangeCarDetails: "2019 Maruti Swift VXi (48,000 km)",
      depositAmountInr: 1000,
      depositStatus: "ESCROW_HELD",
      paymentRefId: "pay_sbx_demo001",
      status: "OPEN",
      expiresAt,
    },
  });

  const q1Calc = calculateOnRoadPrice({
    exShowroomInr: brezza.exShowroomPriceInr,
    rtoRatePercent: brezza.rtoRatePercent,
    cashDiscountInr: 45000,
    exchangeBonusInr: 25000,
    insurancePriceInr: 36500,
    accessoriesCostInr: 0,
    fastagAndMiscInr: 600,
  });

  await prisma.quote.create({
    data: {
      quoteRequestId: sampleRfq.id,
      dealershipId: garuda.id,
      submittedByStaffId: garuda.staff[0].id,
      ...q1Calc,
      accessoriesList: "Complimentary 3D Mats, Mud Flaps & Perfume",
      manufacturingYear: 2025,
      guaranteedDeliveryDays: 3,
      notes: "MY2025 Pearl Arctic White unit available in Whitefield yard for 3-day delivery.",
    },
  });

  const q2Calc = calculateOnRoadPrice({
    exShowroomInr: brezza.exShowroomPriceInr,
    rtoRatePercent: brezza.rtoRatePercent,
    cashDiscountInr: 20000,
    exchangeBonusInr: 20000,
    insurancePriceInr: 42000,
    accessoriesCostInr: 8500,
    fastagAndMiscInr: 600,
  });

  await prisma.quote.create({
    data: {
      quoteRequestId: sampleRfq.id,
      dealershipId: kalyani.id,
      submittedByStaffId: kalyani.staff[0].id,
      ...q2Calc,
      accessoriesList: "Basic Chrome Kit + Floor Mats (Optional)",
      manufacturingYear: 2026,
      guaranteedDeliveryDays: 14,
      notes: "Fresh 2026 batch allotment arriving in 14 days. Zero-dep insurance included.",
    },
  });

  console.log("Seed completed! Sample RFQ ID:", sampleRfq.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
