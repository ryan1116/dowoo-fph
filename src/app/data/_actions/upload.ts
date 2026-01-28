"use server";

import { prisma } from "@/lib/prisma";
import {
  parseMarketDataCsv,
  parseCostMasterCsv,
  type MarketDataRow,
} from "@/lib/csv-parser";
import {
  analyzeMarketData,
  summarizeAnalysis,
  type AnalysisSummary,
  type PriceDataPoint,
} from "@/lib/analysis";

// ── Types ────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: string[];
  analysis?: AnalysisSummary;
}

// ── MarketData import ────────────────────────────────────────────

export async function uploadMarketData(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, importedCount: 0, errorCount: 0, errors: ["No file provided."] };
  }

  const text = await file.text();
  const parsed = parseMarketDataCsv(text);

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 20), // limit displayed errors
    };
  }

  // Batch insert into DB
  try {
    const records = parsed.data.map((row: MarketDataRow) => ({
      date: new Date(row.date),
      origin: row.origin,
      destination: row.destination,
      vehicleType: row.vehicleType,
      freightType: row.freightType,
      unitPrice: row.unitPrice,
    }));

    // Insert in chunks of 500 to avoid SQLite limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      await prisma.marketData.createMany({ data: chunk });
    }

    // Run analysis on all market data (including previously imported)
    const allData = await prisma.marketData.findMany({
      select: { origin: true, destination: true, vehicleType: true, unitPrice: true },
    });

    const dataPoints: PriceDataPoint[] = allData.map(
      (d: { origin: string; destination: string; vehicleType: string; unitPrice: number }) => ({
        origin: d.origin,
        destination: d.destination,
        vehicleType: d.vehicleType,
        unitPrice: d.unitPrice,
      })
    );

    const results = analyzeMarketData(dataPoints);
    const analysis = summarizeAnalysis(results);

    return {
      success: true,
      importedCount: parsed.data.length,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 10),
      analysis,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      errorCount: 1,
      errors: [`Database error: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}

// ── CostMaster import (upsert) ───────────────────────────────────

export async function uploadCostMaster(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, importedCount: 0, errorCount: 0, errors: ["No file provided."] };
  }

  const text = await file.text();
  const parsed = parseCostMasterCsv(text);

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 20),
    };
  }

  try {
    let upsertedCount = 0;

    for (const row of parsed.data) {
      await prisma.costMaster.upsert({
        where: { item: row.item },
        update: {
          category: row.category,
          value: row.value,
          unit: row.unit,
          description: row.description,
        },
        create: {
          category: row.category,
          item: row.item,
          value: row.value,
          unit: row.unit,
          description: row.description,
        },
      });
      upsertedCount++;
    }

    return {
      success: true,
      importedCount: upsertedCount,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 10),
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      errorCount: 1,
      errors: [`Database error: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}

// ── Fetch current data stats ─────────────────────────────────────

export interface DataStats {
  marketDataCount: number;
  costMasterCount: number;
  routeStandardCount: number;
  recentAnalysis?: AnalysisSummary;
}

export async function getDataStats(): Promise<DataStats> {
  const [marketDataCount, costMasterCount, routeStandardCount] = await Promise.all([
    prisma.marketData.count(),
    prisma.costMaster.count(),
    prisma.routeStandard.count(),
  ]);

  let recentAnalysis: AnalysisSummary | undefined;

  if (marketDataCount > 0) {
    const allData = await prisma.marketData.findMany({
      select: { origin: true, destination: true, vehicleType: true, unitPrice: true },
    });

    const dataPoints: PriceDataPoint[] = allData.map(
      (d: { origin: string; destination: string; vehicleType: string; unitPrice: number }) => ({
        origin: d.origin,
        destination: d.destination,
        vehicleType: d.vehicleType,
        unitPrice: d.unitPrice,
      })
    );

    const results = analyzeMarketData(dataPoints);
    recentAnalysis = summarizeAnalysis(results);
  }

  return { marketDataCount, costMasterCount, routeStandardCount, recentAnalysis };
}

// ── Clear data ───────────────────────────────────────────────────

export async function clearMarketData(): Promise<{ deleted: number }> {
  const { count } = await prisma.marketData.deleteMany();
  return { deleted: count };
}
