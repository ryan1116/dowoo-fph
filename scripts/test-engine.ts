/**
 * Test script for the FPH Pricing Engine.
 *
 * Run: npx tsx scripts/test-engine.ts
 *
 * Prerequisites: Run `npx tsx prisma/seed.ts` first to populate test data.
 */

import { calculateFPHPrice, type FPHResult } from "../src/lib/pricing-engine";

function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n) + " KRW";
}

function printResult(result: FPHResult) {
  const { input, tier1, tier2, tier3, summary } = result;

  console.log("═".repeat(60));
  console.log(`Route: ${input.origin} → ${input.destination}`);
  console.log(`Vehicle: ${input.vehicleType} | Freight: ${input.freightType ?? "General"}`);
  console.log("─".repeat(60));

  console.log("\n[Tier 1] Cost-Based Pricing");
  console.log(`  Distance: ${tier1.distanceKm} km (${tier1.distanceSource})`);
  console.log(`  Fuel Cost:       ${formatKRW(tier1.fuelCost)}`);
  console.log(`  Toll Cost:       ${formatKRW(tier1.tollCost)}`);
  console.log(`  Fixed Cost:      ${formatKRW(tier1.fixedCost)}`);
  console.log(`  Driver Profit:   ${formatKRW(tier1.driverProfit)}`);
  console.log(`  ► Tier 1 Base:   ${formatKRW(tier1.subtotal)}`);

  console.log("\n[Tier 2] Market Overlay");
  if (tier2.hasMarketData) {
    console.log(`  Market Median:   ${formatKRW(tier2.marketMedian!)}`);
    console.log(`  Adjustment:      ×${tier2.adjustmentFactor}`);
    console.log(`  Sample Size:     ${tier2.sampleSize}`);
    console.log(`  Confidence:      ${(tier2.confidenceScore * 100).toFixed(0)}%`);
    console.log(`  Fallback:        ${tier2.isFallback ? "Yes (province-level)" : "No (exact route)"}`);
  } else {
    console.log(`  No market data available — using Tier 1 price`);
  }
  console.log(`  ► Tier 2 Adjusted: ${formatKRW(tier2.adjustedPrice)}`);

  console.log("\n[Tier 3] Strategic Finalization");
  console.log(`  Company Margin:  ${(tier3.companyMarginRate * 100).toFixed(0)}% → ${formatKRW(tier3.companyMargin)}`);
  if (tier3.freightRiskRate > 0) {
    console.log(`  Freight Risk:    ${(tier3.freightRiskRate * 100).toFixed(0)}% → ${formatKRW(tier3.freightRiskSurcharge)}`);
  }
  if (tier3.manualAdjustmentRate !== 0) {
    console.log(`  Manual Adj:      ${(tier3.manualAdjustmentRate * 100).toFixed(1)}% → ${formatKRW(tier3.manualAdjustment)}`);
  }
  console.log(`  Before rounding: ${formatKRW(tier3.subtotalBeforeRounding)}`);
  console.log(`  ► FINAL PRICE:   ${formatKRW(tier3.finalPrice)}`);

  console.log("\n[Summary]");
  console.log(`  Tier 1 → Tier 2 → Tier 3: ${formatKRW(summary.tier1_base)} → ${formatKRW(summary.tier2_adjusted)} → ${formatKRW(summary.tier3_final)}`);
  console.log(`  Overall Confidence: ${(summary.overallConfidence * 100).toFixed(0)}%`);
  console.log(`  Data Sources: ${summary.dataSources.join(", ")}`);
  console.log("");
}

async function main() {
  console.log("\n🚛 FPH Pricing Engine Test\n");

  // Test 1: Standard route with market data
  console.log("Test 1: Seoul → Busan (11t, General)");
  const r1 = await calculateFPHPrice({
    origin: "Seoul/Gangnam",
    destination: "Busan/Haeundae",
    vehicleType: "11t",
    freightType: "General",
  });
  printResult(r1);

  // Test 2: Same route with fragile goods
  console.log("Test 2: Seoul → Busan (11t, Fragile - Paper/Glass)");
  const r2 = await calculateFPHPrice({
    origin: "Seoul/Gangnam",
    destination: "Busan/Haeundae",
    vehicleType: "11t",
    freightType: "Fragile",
  });
  printResult(r2);

  // Test 3: Different vehicle type
  console.log("Test 3: Seoul → Daegu (5t, General)");
  const r3 = await calculateFPHPrice({
    origin: "Seoul/Gangseo",
    destination: "Daegu/Dalseo",
    vehicleType: "5t",
    freightType: "General",
  });
  printResult(r3);

  // Test 4: With strategic discount
  console.log("Test 4: Seoul → Busan (25t, General, 5% strategic discount)");
  const r4 = await calculateFPHPrice({
    origin: "Seoul/Gangnam",
    destination: "Busan/Haeundae",
    vehicleType: "25t",
    freightType: "General",
    manualAdjustmentRate: -0.05,
  });
  printResult(r4);

  // Test 5: Low-data route (should trigger province fallback)
  console.log("Test 5: Gangwon → Jeonnam (11t, Refrigerated) — low data route");
  const r5 = await calculateFPHPrice({
    origin: "Gangwon/Wonju",
    destination: "Jeonnam/Yeosu",
    vehicleType: "11t",
    freightType: "Refrigerated",
  });
  printResult(r5);

  // Test 6: No market data at all
  console.log("Test 6: Jeju → Seoul (11t, General) — no market data");
  const r6 = await calculateFPHPrice({
    origin: "Jeju/Jeju",
    destination: "Seoul/Jongno",
    vehicleType: "11t",
    freightType: "General",
  });
  printResult(r6);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
