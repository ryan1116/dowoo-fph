/**
 * Statistical Analysis Utility — the Tier 2 "Brain".
 *
 * Processes MarketData to produce cleaned median prices per route+vehicleType.
 * Uses the IQR (Interquartile Range) method to remove outliers, then computes
 * the median of the remaining data.
 *
 * Fallback strategy:
 *   If a specific route (origin → destination) has insufficient data (< 5 records),
 *   fall back to province-level aggregation by extracting the province from the
 *   City/District format (e.g. "Seoul/Gangnam" → "Seoul").
 */

export interface PriceDataPoint {
  origin: string;
  destination: string;
  vehicleType: string;
  unitPrice: number;
}

export interface RouteMedianResult {
  origin: string;
  destination: string;
  vehicleType: string;
  median: number;
  sampleSize: number;
  filteredSize: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number;
  isFallback: boolean;
  fallbackLevel?: "province";
}

const MIN_SAMPLE_SIZE = 5;

// ── Core statistics ──────────────────────────────────────────────

function sortedNumeric(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const pos = q * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const fraction = pos - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function median(sorted: number[]): number {
  return quantile(sorted, 0.5);
}

// ── IQR outlier removal ─────────────────────────────────────────

interface IQRResult {
  filtered: number[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

function applyIQRFilter(values: number[], multiplier = 1.5): IQRResult {
  const sorted = sortedNumeric(values);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  const filtered = sorted.filter((v) => v >= lowerBound && v <= upperBound);

  return { filtered, q1, q3, iqr, lowerBound, upperBound };
}

// ── Province extraction ─────────────────────────────────────────

/**
 * Extract province (first part) from "City/District" format.
 * "Seoul/Gangnam" → "Seoul"
 * "Gyeongnam/Changwon" → "Gyeongnam"
 * "Seoul" → "Seoul" (no district)
 */
function extractProvince(location: string): string {
  const parts = location.split("/");
  return parts[0].trim();
}

// ── Confidence scoring ──────────────────────────────────────────

/**
 * Compute a 0–1 confidence score based on sample size and data consistency.
 *
 * Factors:
 *   - Sample size (more data → higher confidence, up to ~50 records)
 *   - Coefficient of variation (lower spread → higher confidence)
 *   - Fallback penalty (province-level fallback reduces confidence)
 */
function computeConfidence(
  sampleSize: number,
  filteredValues: number[],
  isFallback: boolean
): number {
  // Size factor: approaches 1.0 as sample size grows
  const sizeFactor = Math.min(sampleSize / 30, 1.0);

  // Consistency factor: based on coefficient of variation
  let consistencyFactor = 1.0;
  if (filteredValues.length >= 2) {
    const mean =
      filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length;
    if (mean > 0) {
      const variance =
        filteredValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
        filteredValues.length;
      const cv = Math.sqrt(variance) / mean; // coefficient of variation
      consistencyFactor = Math.max(0, 1.0 - cv); // lower CV → higher score
    }
  }

  const rawScore = sizeFactor * 0.6 + consistencyFactor * 0.4;
  const fallbackPenalty = isFallback ? 0.7 : 1.0;

  return Math.round(rawScore * fallbackPenalty * 100) / 100;
}

// ── Route key helpers ───────────────────────────────────────────

type RouteKey = string;

function routeKey(origin: string, destination: string, vehicleType: string): RouteKey {
  return `${origin}||${destination}||${vehicleType}`;
}

function provinceRouteKey(origin: string, destination: string, vehicleType: string): RouteKey {
  return `${extractProvince(origin)}||${extractProvince(destination)}||${vehicleType}`;
}

// ── Main analysis function ──────────────────────────────────────

/**
 * Analyse market data and compute cleaned median prices per route.
 *
 * 1. Group prices by (origin, destination, vehicleType).
 * 2. For groups with >= MIN_SAMPLE_SIZE records, apply IQR filter and compute median.
 * 3. For groups with < MIN_SAMPLE_SIZE records, fall back to province-level grouping.
 */
export function analyzeMarketData(data: PriceDataPoint[]): RouteMedianResult[] {
  // ── Step 1: Group by exact route ────────────────────────────
  const routeGroups = new Map<RouteKey, { origin: string; destination: string; vehicleType: string; prices: number[] }>();

  for (const d of data) {
    const key = routeKey(d.origin, d.destination, d.vehicleType);
    let group = routeGroups.get(key);
    if (!group) {
      group = { origin: d.origin, destination: d.destination, vehicleType: d.vehicleType, prices: [] };
      routeGroups.set(key, group);
    }
    group.prices.push(d.unitPrice);
  }

  // ── Step 2: Province-level fallback pool ────────────────────
  const provinceGroups = new Map<RouteKey, { origin: string; destination: string; vehicleType: string; prices: number[] }>();

  for (const d of data) {
    const provOrigin = extractProvince(d.origin);
    const provDest = extractProvince(d.destination);
    const key = provinceRouteKey(d.origin, d.destination, d.vehicleType);
    let group = provinceGroups.get(key);
    if (!group) {
      group = { origin: provOrigin, destination: provDest, vehicleType: d.vehicleType, prices: [] };
      provinceGroups.set(key, group);
    }
    group.prices.push(d.unitPrice);
  }

  // ── Step 3: Compute results ─────────────────────────────────
  const results: RouteMedianResult[] = [];
  const processedProvinceKeys = new Set<RouteKey>();

  for (const [, group] of routeGroups) {
    if (group.prices.length >= MIN_SAMPLE_SIZE) {
      // Enough data — use exact route
      const iqr = applyIQRFilter(group.prices);
      const med = median(sortedNumeric(iqr.filtered));
      results.push({
        origin: group.origin,
        destination: group.destination,
        vehicleType: group.vehicleType,
        median: Math.round(med),
        sampleSize: group.prices.length,
        filteredSize: iqr.filtered.length,
        q1: Math.round(iqr.q1),
        q3: Math.round(iqr.q3),
        iqr: Math.round(iqr.iqr),
        lowerBound: Math.round(iqr.lowerBound),
        upperBound: Math.round(iqr.upperBound),
        confidenceScore: computeConfidence(group.prices.length, iqr.filtered, false),
        isFallback: false,
      });
    } else {
      // Not enough data — try province-level fallback
      const provKey = provinceRouteKey(group.origin, group.destination, group.vehicleType);
      if (processedProvinceKeys.has(provKey)) continue;
      processedProvinceKeys.add(provKey);

      const provGroup = provinceGroups.get(provKey);
      if (!provGroup || provGroup.prices.length < MIN_SAMPLE_SIZE) {
        // Even province-level doesn't have enough data — still report with low confidence
        const prices = provGroup?.prices ?? group.prices;
        const sorted = sortedNumeric(prices);
        const med = median(sorted);
        results.push({
          origin: group.origin,
          destination: group.destination,
          vehicleType: group.vehicleType,
          median: Math.round(med),
          sampleSize: prices.length,
          filteredSize: prices.length,
          q1: Math.round(quantile(sorted, 0.25)),
          q3: Math.round(quantile(sorted, 0.75)),
          iqr: 0,
          lowerBound: 0,
          upperBound: 0,
          confidenceScore: computeConfidence(prices.length, prices, true),
          isFallback: true,
          fallbackLevel: "province",
        });
      } else {
        const iqr = applyIQRFilter(provGroup.prices);
        const med = median(sortedNumeric(iqr.filtered));
        results.push({
          origin: provGroup.origin,
          destination: provGroup.destination,
          vehicleType: provGroup.vehicleType,
          median: Math.round(med),
          sampleSize: provGroup.prices.length,
          filteredSize: iqr.filtered.length,
          q1: Math.round(iqr.q1),
          q3: Math.round(iqr.q3),
          iqr: Math.round(iqr.iqr),
          lowerBound: Math.round(iqr.lowerBound),
          upperBound: Math.round(iqr.upperBound),
          confidenceScore: computeConfidence(provGroup.prices.length, iqr.filtered, true),
          isFallback: true,
          fallbackLevel: "province",
        });
      }
    }
  }

  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

// ── Summary helper ──────────────────────────────────────────────

export interface AnalysisSummary {
  totalRoutes: number;
  exactRoutes: number;
  fallbackRoutes: number;
  avgConfidence: number;
  topRoutes: RouteMedianResult[];
}

export function summarizeAnalysis(
  results: RouteMedianResult[],
  topN = 10
): AnalysisSummary {
  const exactRoutes = results.filter((r) => !r.isFallback).length;
  const fallbackRoutes = results.filter((r) => r.isFallback).length;
  const avgConfidence =
    results.length > 0
      ? Math.round(
          (results.reduce((sum, r) => sum + r.confidenceScore, 0) /
            results.length) *
            100
        ) / 100
      : 0;

  return {
    totalRoutes: results.length,
    exactRoutes,
    fallbackRoutes,
    avgConfidence,
    topRoutes: results.slice(0, topN),
  };
}
