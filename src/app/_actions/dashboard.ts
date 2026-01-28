"use server";

import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  marketDataCount: number;
  costMasterCount: number;
  routeStandardCount: number;
  fuelPrice: number | null;
  companyMargin: number | null;
  driverProfit: number | null;
  uniqueRoutes: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [marketDataCount, costMasterCount, routeStandardCount] =
    await Promise.all([
      prisma.marketData.count(),
      prisma.costMaster.count(),
      prisma.routeStandard.count(),
    ]);

  // Fetch key cost variables
  const fuelRow = await prisma.costMaster.findUnique({ where: { item: "fuel_price" } });
  const marginRow = await prisma.costMaster.findUnique({ where: { item: "company_margin_rate" } });
  const driverRow = await prisma.costMaster.findUnique({ where: { item: "driver_profit_rate" } });

  // Count unique origin-destination-vehicle combinations in market data
  const uniqueRoutesRaw = await prisma.marketData.findMany({
    distinct: ["origin", "destination", "vehicleType"],
    select: { origin: true, destination: true, vehicleType: true },
  });

  return {
    marketDataCount,
    costMasterCount,
    routeStandardCount,
    fuelPrice: fuelRow?.value ?? null,
    companyMargin: marginRow?.value ?? null,
    driverProfit: driverRow?.value ?? null,
    uniqueRoutes: uniqueRoutesRaw.length,
  };
}
