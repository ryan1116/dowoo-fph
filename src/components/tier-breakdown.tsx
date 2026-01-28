"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, CheckCircle2, Info, TruckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FPHResult } from "@/lib/pricing-engine";

interface TierBreakdownProps {
  result: FPHResult;
}

function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function confidenceColor(score: number): string {
  if (score >= 0.7) return "text-green-600";
  if (score >= 0.4) return "text-yellow-600";
  return "text-red-600";
}

function confidenceBadge(score: number) {
  const pct = `${(score * 100).toFixed(0)}%`;
  if (score >= 0.7) return <Badge variant="default">{pct}</Badge>;
  if (score >= 0.4) return <Badge variant="secondary">{pct}</Badge>;
  return <Badge variant="destructive">{pct}</Badge>;
}

const TIER_COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

export function TierBreakdown({ result }: TierBreakdownProps) {
  const { input, tier1, tier2, tier3, summary } = result;

  const chartData = [
    { name: "Tier 1\nCost Base", value: summary.tier1_base, fill: TIER_COLORS[0] },
    { name: "Tier 2\nMarket", value: summary.tier2_adjusted, fill: TIER_COLORS[1] },
    { name: "Tier 3\nFinal", value: summary.tier3_final, fill: TIER_COLORS[2] },
  ];

  return (
    <div className="space-y-4">
      {/* Route header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TruckIcon className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">
                  {input.origin} → {input.destination}
                </p>
                <p className="text-sm text-muted-foreground">
                  {input.vehicleType} · {input.freightType ?? "General"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatKRW(tier3.finalPrice)}</p>
              <p className="text-sm text-muted-foreground">KRW (Final Price)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence + warnings */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Confidence:</span>
          {confidenceBadge(summary.overallConfidence)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sources:</span>
          {summary.dataSources.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {tier2.isFallback && tier2.hasMarketData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Exact route data insufficient. Market price based on <strong>province-level</strong> aggregation (lower confidence).
          </AlertDescription>
        </Alert>
      )}

      {!tier2.hasMarketData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No historical market data for this route/vehicle combination. Price is based on <strong>cost calculation only</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tier Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}만`}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number | undefined) => [`${formatKRW(value ?? 0)} KRW`, "Price"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={TIER_COLORS[idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed tier breakdowns */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tier 1 */}
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Tier 1: Cost Base</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {formatKRW(tier1.subtotal)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Distance" value={`${tier1.distanceKm} km`} sub={tier1.distanceSource} />
            <Row label="Fuel Cost" value={formatKRW(tier1.fuelCost)} />
            <Row label="Toll Cost" value={formatKRW(tier1.tollCost)} />
            <Row label="Fixed Cost" value={formatKRW(tier1.fixedCost)} />
            <div className="border-t pt-2">
              <Row label="Driver Profit" value={formatKRW(tier1.driverProfit)} highlight />
            </div>
          </CardContent>
        </Card>

        {/* Tier 2 */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Tier 2: Market Overlay</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {formatKRW(tier2.adjustedPrice)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tier2.hasMarketData ? (
              <>
                <Row label="Market Median" value={formatKRW(tier2.marketMedian!)} />
                <Row label="Adjustment" value={`×${tier2.adjustmentFactor}`} />
                <Row label="Samples" value={String(tier2.sampleSize)} />
                <Row
                  label="Confidence"
                  value={`${(tier2.confidenceScore * 100).toFixed(0)}%`}
                  className={confidenceColor(tier2.confidenceScore)}
                />
                {tier2.isFallback && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertTriangle className="h-3 w-3" /> Province fallback
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">No market data — pass-through from Tier 1</p>
            )}
          </CardContent>
        </Card>

        {/* Tier 3 */}
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Tier 3: Strategic</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {formatKRW(tier3.finalPrice)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={`Margin (${(tier3.companyMarginRate * 100).toFixed(0)}%)`}
              value={`+${formatKRW(tier3.companyMargin)}`}
            />
            {tier3.freightRiskRate > 0 && (
              <Row
                label={`Freight Risk (${(tier3.freightRiskRate * 100).toFixed(0)}%)`}
                value={`+${formatKRW(tier3.freightRiskSurcharge)}`}
              />
            )}
            {tier3.manualAdjustmentRate !== 0 && (
              <Row
                label={`Manual (${(tier3.manualAdjustmentRate * 100).toFixed(1)}%)`}
                value={`${tier3.manualAdjustment >= 0 ? "+" : ""}${formatKRW(tier3.manualAdjustment)}`}
              />
            )}
            <div className="border-t pt-2">
              <Row label="Before rounding" value={formatKRW(tier3.subtotalBeforeRounding)} />
              <Row label="Rounded (↑1,000)" value={formatKRW(tier3.finalPrice)} highlight />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
            <span className="font-mono font-medium text-indigo-600">{formatKRW(summary.tier1_base)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-mono font-medium text-green-600">{formatKRW(summary.tier2_adjusted)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-mono font-bold text-amber-600 text-lg">{formatKRW(summary.tier3_final)} KRW</span>
            <CheckCircle2 className={`h-4 w-4 ml-1 ${confidenceColor(summary.overallConfidence)}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  highlight,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`font-mono ${highlight ? "font-bold" : ""} ${className ?? ""}`}>
          {value}
        </span>
        {sub && <span className="ml-1 text-xs text-muted-foreground">({sub})</span>}
      </div>
    </div>
  );
}
