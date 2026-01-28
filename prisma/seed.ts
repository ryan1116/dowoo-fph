import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CostMaster defaults...");

  const costItems = [
    // Variable costs
    { category: "Variable", item: "fuel_price", value: 1650, unit: "KRW/L", description: "Diesel fuel price per liter" },
    { category: "Variable", item: "fuel_efficiency", value: 3.5, unit: "km/L", description: "Default fuel efficiency (11t truck)" },
    { category: "Variable", item: "toll_rate", value: 120, unit: "KRW/km", description: "Average highway toll cost per km" },

    // Fixed costs
    { category: "Fixed", item: "vehicle_fixed_cost", value: 150000, unit: "KRW/trip", description: "Depreciation + insurance + maintenance per trip" },

    // Policy
    { category: "Policy", item: "driver_profit_rate", value: 0.15, unit: "%", description: "Guaranteed driver profit (15% of operating cost)" },
    { category: "Policy", item: "company_margin_rate", value: 0.08, unit: "%", description: "Dowoo Logistics company margin (8%)" },

    // Risk surcharges
    { category: "Risk", item: "freight_risk_fragile", value: 0.12, unit: "%", description: "Surcharge for fragile goods (paper, glass, etc.)" },
    { category: "Risk", item: "freight_risk_refrigerated", value: 0.15, unit: "%", description: "Surcharge for refrigerated/cold chain goods" },
    { category: "Risk", item: "freight_risk_hazardous", value: 0.20, unit: "%", description: "Surcharge for hazardous materials" },
  ];

  for (const item of costItems) {
    await prisma.costMaster.upsert({
      where: { item: item.item },
      update: { value: item.value, unit: item.unit, description: item.description, category: item.category },
      create: item,
    });
  }
  console.log(`  ✓ ${costItems.length} cost variables seeded`);

  // ── Sample MarketData ──────────────────────────────────────
  console.log("Seeding sample MarketData...");

  const marketRecords = generateSampleMarketData();
  await prisma.marketData.createMany({ data: marketRecords });
  console.log(`  ✓ ${marketRecords.length} market data records seeded`);

  console.log("Done.");
}

/**
 * Generate realistic sample market data for testing.
 * Creates ~200 records across several routes and vehicle types.
 */
function generateSampleMarketData() {
  const routes = [
    { origin: "Seoul/Gangnam", destination: "Busan/Haeundae", basePrices: { "5t": 650000, "11t": 850000, "25t": 1200000 } },
    { origin: "Seoul/Yeongdeungpo", destination: "Busan/Sasang", basePrices: { "5t": 620000, "11t": 830000, "25t": 1180000 } },
    { origin: "Seoul/Gangseo", destination: "Daegu/Dalseo", basePrices: { "5t": 450000, "11t": 600000, "25t": 900000 } },
    { origin: "Incheon/Namdong", destination: "Gwangju/Buk", basePrices: { "5t": 500000, "11t": 680000, "25t": 950000 } },
    { origin: "Gyeonggi/Pyeongtaek", destination: "Gyeongnam/Changwon", basePrices: { "5t": 550000, "11t": 720000, "25t": 1050000 } },
    { origin: "Seoul/Songpa", destination: "Daejeon/Yuseong", basePrices: { "5t": 280000, "11t": 380000, "25t": 550000 } },
    { origin: "Gyeonggi/Icheon", destination: "Busan/Gangseo", basePrices: { "5t": 630000, "11t": 840000, "25t": 1190000 } },
    // Low-data routes (will trigger province fallback)
    { origin: "Gangwon/Wonju", destination: "Jeonnam/Yeosu", basePrices: { "11t": 750000 } },
    { origin: "Chungbuk/Cheongju", destination: "Gyeongbuk/Pohang", basePrices: { "11t": 520000 } },
  ];

  const freightTypes = ["General", "General", "General", "Fragile", "Refrigerated"];
  const records: Array<{
    date: Date;
    origin: string;
    destination: string;
    vehicleType: string;
    freightType: string;
    unitPrice: number;
  }> = [];

  for (const route of routes) {
    for (const [vehicleType, basePrice] of Object.entries(route.basePrices)) {
      // Generate 8–25 records per route/vehicle combo over the past year
      const count = Object.keys(route.basePrices).length > 1
        ? 15 + Math.floor(Math.random() * 10) // high-data routes
        : 3; // low-data routes for fallback testing

      for (let i = 0; i < count; i++) {
        // Randomize date within the past 365 days
        const daysAgo = Math.floor(Math.random() * 365);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(0, 0, 0, 0);

        // Randomize price: ±15% variation, with occasional outliers (±40%)
        const isOutlier = Math.random() < 0.08;
        const variation = isOutlier
          ? 1 + (Math.random() - 0.5) * 0.8  // ±40%
          : 1 + (Math.random() - 0.5) * 0.3; // ±15%
        const unitPrice = Math.round(basePrice * variation);

        records.push({
          date,
          origin: route.origin,
          destination: route.destination,
          vehicleType,
          freightType: freightTypes[Math.floor(Math.random() * freightTypes.length)],
          unitPrice,
        });
      }
    }
  }

  return records;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
