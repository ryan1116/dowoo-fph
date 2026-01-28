/**
 * FPH Pricing Engine — Unified 3-Tier Calculation
 *
 * Integrates:
 *   Tier 1 (Fundamental Base)  → Cost-based pricing from CostMaster variables
 *   Tier 2 (Market Overlay)    → IQR-cleaned market median adjustment
 *   Tier 3 (Logistics Strategy)→ Company margin, freight risk, strategic adjustment
 *
 * Rounding Policy: Final price is ALWAYS rounded UP to the nearest 1,000 KRW.
 */

import { prisma } from "@/lib/prisma";
import { getRouteDistance, type RouteDistanceResult } from "@/lib/route-distance";
import {
  analyzeMarketData,
  type PriceDataPoint,
  type RouteMedianResult,
} from "@/lib/analysis";

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface FPHInput {
  origin: string;        // e.g. "Seoul/Gangnam"
  destination: string;   // e.g. "Busan/Haeundae"
  vehicleType: string;   // e.g. "11t"
  freightType?: string;  // e.g. "General", "Fragile", "Refrigerated"
  manualAdjustmentRate?: number; // optional strategic override (e.g. -0.05 for 5% discount)
}

export interface Tier1Breakdown {
  fuelCost: number;
  tollCost: number;
  fixedCost: number;      // vehicle depreciation, insurance, maintenance per trip
  driverProfit: number;   // guaranteed driver income
  subtotal: number;
  distanceKm: number;
  distanceSource: string;
}

export interface Tier2Breakdown {
  marketMedian: number | null;
  adjustmentFactor: number; // ratio applied: marketMedian / tier1_base
  adjustedPrice: number;
  sampleSize: number;
  confidenceScore: number;
  isFallback: boolean;
  hasMarketData: boolean;
}

export interface Tier3Breakdown {
  companyMarginRate: number;
  companyMargin: number;
  freightRiskRate: number;
  freightRiskSurcharge: number;
  manualAdjustmentRate: number;
  manualAdjustment: number;
  subtotalBeforeRounding: number;
  finalPrice: number; // rounded UP to nearest 1,000 KRW
}

export interface FPHResult {
  input: FPHInput;
  tier1: Tier1Breakdown;
  tier2: Tier2Breakdown;
  tier3: Tier3Breakdown;
  summary: {
    tier1_base: number;
    tier2_adjusted: number;
    tier3_final: number;
    overallConfidence: number;
    dataSources: string[];
  };
}

// ══════════════════════════════════════════════════════════════════
// CostMaster variable fetching
// ══════════════════════════════════════════════════════════════════

interface CostVariables {
  // Variable costs
  fuel_price: number;          // KRW/L
  fuel_efficiency: number;     // km/L for the vehicle type
  toll_rate: number;           // KRW/km (average toll cost per km)

  // Fixed costs (per trip)
  vehicle_fixed_cost: number;  // KRW (depreciation + insurance + maintenance per trip)

  // Policy
  driver_profit_rate: number;  // % (guaranteed driver profit as % of cost)
  company_margin_rate: number; // % (Dowoo Logistics margin)

  // Risk surcharges
  freight_risk_fragile: number;    // % surcharge for fragile goods
  freight_risk_refrigerated: number; // % surcharge for refrigerated
  freight_risk_hazardous: number;  // % surcharge for hazardous
}

const COST_DEFAULTS: CostVariables = {
  fuel_price: 1650,            // KRW/L (diesel)
  fuel_efficiency: 3.5,        // km/L for a typical 11t truck
  toll_rate: 120,              // KRW/km average toll
  vehicle_fixed_cost: 150000,  // KRW per trip
  driver_profit_rate: 0.15,    // 15%
  company_margin_rate: 0.08,   // 8%
  freight_risk_fragile: 0.12,  // 12% surcharge
  freight_risk_refrigerated: 0.15, // 15% surcharge
  freight_risk_hazardous: 0.20,    // 20% surcharge
};

/**
 * Fetch cost variables from CostMaster DB, falling back to defaults.
 */
async function fetchCostVariables(): Promise<CostVariables> {
  const rows = await prisma.costMaster.findMany();
  const map = new Map(rows.map((r: { item: string; value: number }) => [r.item, r.value]));

  return {
    fuel_price: map.get("fuel_price") ?? COST_DEFAULTS.fuel_price,
    fuel_efficiency: map.get("fuel_efficiency") ?? COST_DEFAULTS.fuel_efficiency,
    toll_rate: map.get("toll_rate") ?? COST_DEFAULTS.toll_rate,
    vehicle_fixed_cost: map.get("vehicle_fixed_cost") ?? COST_DEFAULTS.vehicle_fixed_cost,
    driver_profit_rate: map.get("driver_profit_rate") ?? COST_DEFAULTS.driver_profit_rate,
    company_margin_rate: map.get("company_margin_rate") ?? COST_DEFAULTS.company_margin_rate,
    freight_risk_fragile: map.get("freight_risk_fragile") ?? COST_DEFAULTS.freight_risk_fragile,
    freight_risk_refrigerated: map.get("freight_risk_refrigerated") ?? COST_DEFAULTS.freight_risk_refrigerated,
    freight_risk_hazardous: map.get("freight_risk_hazardous") ?? COST_DEFAULTS.freight_risk_hazardous,
  };
}

// ══════════════════════════════════════════════════════════════════
// Vehicle fuel efficiency lookup
// ══════════════════════════════════════════════════════════════════

const VEHICLE_EFFICIENCY: Record<string, number> = {
  "1t": 8.0,
  "2.5t": 6.5,
  "3.5t": 5.5,
  "5t": 4.5,
  "8t": 4.0,
  "11t": 3.5,
  "15t": 3.0,
  "18t": 2.8,
  "25t": 2.5,
};

function getEfficiency(vehicleType: string, defaultEff: number): number {
  return VEHICLE_EFFICIENCY[vehicleType] ?? defaultEff;
}

// ══════════════════════════════════════════════════════════════════
// Tier 1: Cost-Based Pricing
// ══════════════════════════════════════════════════════════════════

function calculateTier1(
  distance: RouteDistanceResult,
  vehicleType: string,
  costs: CostVariables
): Tier1Breakdown {
  const km = distance.distanceKm;
  const efficiency = getEfficiency(vehicleType, costs.fuel_efficiency);

  // Variable costs
  const fuelCost = Math.round((km / efficiency) * costs.fuel_price);
  const tollCost = Math.round(km * costs.toll_rate);

  // Fixed costs per trip
  const fixedCost = costs.vehicle_fixed_cost;

  // Subtotal before driver profit
  const operatingCost = fuelCost + tollCost + fixedCost;

  // Driver guaranteed profit
  const driverProfit = Math.round(operatingCost * costs.driver_profit_rate);

  const subtotal = operatingCost + driverProfit;

  return {
    fuelCost,
    tollCost,
    fixedCost,
    driverProfit,
    subtotal,
    distanceKm: km,
    distanceSource: distance.source,
  };
}

// ══════════════════════════════════════════════════════════════════
// Tier 2: Market-Based Adjustment
// ══════════════════════════════════════════════════════════════════

/**
 * Find the market median for a specific route + vehicleType.
 * Returns null if no market data exists.
 */
async function findMarketMedian(
  origin: string,
  destination: string,
  vehicleType: string
): Promise<RouteMedianResult | null> {
  const allData = await prisma.marketData.findMany({
    where: { vehicleType },
    select: { origin: true, destination: true, vehicleType: true, unitPrice: true },
  });

  if (allData.length === 0) return null;

  const dataPoints: PriceDataPoint[] = allData.map(
    (d: { origin: string; destination: string; vehicleType: string; unitPrice: number }) => ({
      origin: d.origin,
      destination: d.destination,
      vehicleType: d.vehicleType,
      unitPrice: d.unitPrice,
    })
  );

  const results = analyzeMarketData(dataPoints);

  // Try exact match first
  const exactMatch = results.find(
    (r) => r.origin === origin && r.destination === destination
  );
  if (exactMatch) return exactMatch;

  // Try province-level fallback match
  const originProv = origin.split("/")[0].trim();
  const destProv = destination.split("/")[0].trim();
  const fallbackMatch = results.find(
    (r) => r.isFallback && r.origin === originProv && r.destination === destProv
  );
  return fallbackMatch ?? null;
}

function calculateTier2(
  tier1Base: number,
  marketResult: RouteMedianResult | null
): Tier2Breakdown {
  if (!marketResult) {
    // No market data — pass through Tier 1 price unchanged
    return {
      marketMedian: null,
      adjustmentFactor: 1.0,
      adjustedPrice: tier1Base,
      sampleSize: 0,
      confidenceScore: 0,
      isFallback: false,
      hasMarketData: false,
    };
  }

  const marketMedian = marketResult.median;
  const confidence = marketResult.confidenceScore;

  // Blended adjustment: weighted average of cost-based and market-based.
  // Higher confidence → more weight to market data.
  // adjustedPrice = tier1 * (1 - confidence) + marketMedian * confidence
  //
  // This ensures:
  //   - Low confidence (few data points) → price stays close to Tier 1 cost
  //   - High confidence (rich data) → price converges toward market median
  const adjustedPrice = Math.round(
    tier1Base * (1 - confidence) + marketMedian * confidence
  );

  const adjustmentFactor =
    tier1Base > 0 ? Math.round((adjustedPrice / tier1Base) * 1000) / 1000 : 1.0;

  return {
    marketMedian,
    adjustmentFactor,
    adjustedPrice,
    sampleSize: marketResult.sampleSize,
    confidenceScore: confidence,
    isFallback: marketResult.isFallback,
    hasMarketData: true,
  };
}

// ══════════════════════════════════════════════════════════════════
// Tier 3: Strategic Finalization
// ══════════════════════════════════════════════════════════════════

/**
 * Freight risk surcharge rate based on cargo type.
 */
function getFreightRiskRate(
  freightType: string | undefined,
  costs: CostVariables
): number {
  if (!freightType) return 0;

  const normalized = freightType.toLowerCase();

  if (["fragile", "paper", "glass", "ceramic", "electronics"].some((k) => normalized.includes(k))) {
    return costs.freight_risk_fragile;
  }
  if (["refrigerated", "frozen", "chilled", "cold"].some((k) => normalized.includes(k))) {
    return costs.freight_risk_refrigerated;
  }
  if (["hazardous", "chemical", "flammable", "explosive"].some((k) => normalized.includes(k))) {
    return costs.freight_risk_hazardous;
  }

  return 0; // "General" or unknown → no surcharge
}

/**
 * Round UP to the nearest 1,000 KRW.
 * 850,001 → 851,000 ; 850,000 → 850,000
 */
function ceilTo1000(value: number): number {
  return Math.ceil(value / 1000) * 1000;
}

function calculateTier3(
  tier2Price: number,
  freightType: string | undefined,
  manualAdjustmentRate: number,
  costs: CostVariables
): Tier3Breakdown {
  // Company margin
  const companyMarginRate = costs.company_margin_rate;
  const companyMargin = Math.round(tier2Price * companyMarginRate);

  // Freight risk surcharge
  const freightRiskRate = getFreightRiskRate(freightType, costs);
  const freightRiskSurcharge = Math.round(tier2Price * freightRiskRate);

  // Manual strategic adjustment (positive = increase, negative = discount)
  const manualAdjustment = Math.round(tier2Price * manualAdjustmentRate);

  const subtotalBeforeRounding =
    tier2Price + companyMargin + freightRiskSurcharge + manualAdjustment;

  // Rounding policy: ceil to nearest 1,000 KRW
  const finalPrice = ceilTo1000(subtotalBeforeRounding);

  return {
    companyMarginRate,
    companyMargin,
    freightRiskRate,
    freightRiskSurcharge,
    manualAdjustmentRate,
    manualAdjustment,
    subtotalBeforeRounding,
    finalPrice,
  };
}

// ══════════════════════════════════════════════════════════════════
// Overall confidence
// ══════════════════════════════════════════════════════════════════

function computeOverallConfidence(
  distanceSource: string,
  tier2: Tier2Breakdown
): number {
  // Distance confidence
  const distConf = distanceSource === "lookup" ? 1.0 : 0.6;

  // Market data confidence
  const marketConf = tier2.hasMarketData ? tier2.confidenceScore : 0.3;

  // Weighted average: distance 30%, market 70%
  const overall = distConf * 0.3 + marketConf * 0.7;
  return Math.round(overall * 100) / 100;
}

// ══════════════════════════════════════════════════════════════════
// Main Entry Point
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate the full FPH price for a given route.
 *
 * @param input - Route parameters
 * @returns FPHResult with detailed breakdown of all 3 tiers
 */
export async function calculateFPHPrice(input: FPHInput): Promise<FPHResult> {
  const {
    origin,
    destination,
    vehicleType,
    freightType,
    manualAdjustmentRate = 0,
  } = input;

  // Fetch cost variables from DB (with defaults)
  const costs = await fetchCostVariables();

  // Get route distance
  const distance = getRouteDistance(origin, destination);

  // ── Tier 1 ─────────────────────────────────────────────────
  const tier1 = calculateTier1(distance, vehicleType, costs);

  // ── Tier 2 ─────────────────────────────────────────────────
  const marketResult = await findMarketMedian(origin, destination, vehicleType);
  const tier2 = calculateTier2(tier1.subtotal, marketResult);

  // ── Tier 3 ─────────────────────────────────────────────────
  const tier3 = calculateTier3(
    tier2.adjustedPrice,
    freightType,
    manualAdjustmentRate,
    costs
  );

  // ── Data sources ───────────────────────────────────────────
  const dataSources: string[] = ["CostMaster"];
  if (tier2.hasMarketData) dataSources.push("MarketData (IQR)");
  if (distance.source === "lookup") dataSources.push("RouteDistance (lookup)");
  else dataSources.push("RouteDistance (haversine estimate)");

  const overallConfidence = computeOverallConfidence(distance.source, tier2);

  return {
    input,
    tier1,
    tier2,
    tier3,
    summary: {
      tier1_base: tier1.subtotal,
      tier2_adjusted: tier2.adjustedPrice,
      tier3_final: tier3.finalPrice,
      overallConfidence,
      dataSources,
    },
  };
}

// ══════════════════════════════════════════════════════════════════
// Batch calculation & persistence
// ══════════════════════════════════════════════════════════════════

/**
 * Calculate FPH for a route and persist the result to RouteStandard.
 */
export async function calculateAndSave(input: FPHInput): Promise<FPHResult> {
  const result = await calculateFPHPrice(input);

  await prisma.routeStandard.upsert({
    where: {
      origin_destination_vehicleType: {
        origin: input.origin,
        destination: input.destination,
        vehicleType: input.vehicleType,
      },
    },
    update: {
      basePrice: result.summary.tier1_base,
      marketAdjustedPrice: result.summary.tier2_adjusted,
      finalPrice: result.summary.tier3_final,
      confidenceScore: result.summary.overallConfidence,
    },
    create: {
      origin: input.origin,
      destination: input.destination,
      vehicleType: input.vehicleType,
      basePrice: result.summary.tier1_base,
      marketAdjustedPrice: result.summary.tier2_adjusted,
      finalPrice: result.summary.tier3_final,
      confidenceScore: result.summary.overallConfidence,
    },
  });

  return result;
}
