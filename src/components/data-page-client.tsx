"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUpload } from "@/components/csv-upload";
import { UploadResultDisplay } from "@/components/upload-result";
import { DataStatsDisplay } from "@/components/data-stats";
import {
  uploadMarketData,
  uploadCostMaster,
  getDataStats,
  clearMarketData,
  type UploadResult,
  type DataStats,
} from "@/app/data/_actions/upload";

interface DataPageClientProps {
  initialStats: DataStats;
}

export function DataPageClient({ initialStats }: DataPageClientProps) {
  const [stats, setStats] = useState<DataStats>(initialStats);
  const [marketResult, setMarketResult] = useState<UploadResult | null>(null);
  const [costResult, setCostResult] = useState<UploadResult | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const newStats = await getDataStats();
      setStats(newStats);
    });
  }

  function handleClearMarketData() {
    if (!confirm("Are you sure you want to delete all market data records?")) return;
    startRefresh(async () => {
      await clearMarketData();
      const newStats = await getDataStats();
      setStats(newStats);
      setMarketResult(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Database stats */}
      <DataStatsDisplay
        stats={stats}
        onRefresh={handleRefresh}
        onClearMarketData={handleClearMarketData}
        isRefreshing={isRefreshing}
      />

      {/* Upload tabs */}
      <Tabs defaultValue="market" className="space-y-4">
        <TabsList>
          <TabsTrigger value="market">Market Data (Tier 2)</TabsTrigger>
          <TabsTrigger value="cost">Cost Variables (Tier 1)</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          <CsvUpload
            title="Import Market Data"
            description="Upload historical freight pricing data (1-year CSV). Records will be appended to existing data."
            expectedColumns="date, origin, destination, vehicleType, freightType, unitPrice"
            onUpload={uploadMarketData}
            onComplete={(result) => {
              setMarketResult(result);
              handleRefresh();
            }}
          />
          {marketResult && (
            <UploadResultDisplay result={marketResult} type="MarketData" />
          )}
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <CsvUpload
            title="Import Cost Variables"
            description="Upload cost master data. Existing items will be updated (upsert by item name)."
            expectedColumns="category, item, value, unit, description"
            onUpload={uploadCostMaster}
            onComplete={(result) => {
              setCostResult(result);
              handleRefresh();
            }}
          />
          {costResult && (
            <UploadResultDisplay result={costResult} type="CostMaster" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
