"use client";

import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UploadResult } from "@/app/data/_actions/upload";

interface UploadResultDisplayProps {
  result: UploadResult;
  type: "MarketData" | "CostMaster";
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function confidenceBadge(score: number) {
  if (score >= 0.7) return <Badge variant="default">{(score * 100).toFixed(0)}%</Badge>;
  if (score >= 0.4) return <Badge variant="secondary">{(score * 100).toFixed(0)}%</Badge>;
  return <Badge variant="destructive">{(score * 100).toFixed(0)}%</Badge>;
}

export function UploadResultDisplay({ result, type }: UploadResultDisplayProps) {
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Import Failed</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-disc pl-4 text-sm">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success summary */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Import Successful</AlertTitle>
        <AlertDescription>
          {result.importedCount} records imported
          {result.errorCount > 0 && ` (${result.errorCount} rows skipped)`}.
        </AlertDescription>
      </Alert>

      {/* Skipped row warnings */}
      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Skipped Rows</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc pl-4 text-sm">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis results (MarketData only) */}
      {type === "MarketData" && result.analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Tier 2 Analysis (IQR Median)</h4>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total Routes" value={String(result.analysis.totalRoutes)} />
            <StatCard label="Exact Match" value={String(result.analysis.exactRoutes)} />
            <StatCard label="Province Fallback" value={String(result.analysis.fallbackRoutes)} />
            <StatCard label="Avg Confidence" value={`${(result.analysis.avgConfidence * 100).toFixed(0)}%`} />
          </div>

          {/* Top routes table */}
          {result.analysis.topRoutes.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Median (KRW)</TableHead>
                    <TableHead className="text-right">Samples</TableHead>
                    <TableHead className="text-right">IQR Range</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.analysis.topRoutes.map((route, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{route.origin}</TableCell>
                      <TableCell>{route.destination}</TableCell>
                      <TableCell>{route.vehicleType}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatKRW(route.median)}
                      </TableCell>
                      <TableCell className="text-right">
                        {route.filteredSize}/{route.sampleSize}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {route.iqr > 0
                          ? `${formatKRW(route.lowerBound)} – ${formatKRW(route.upperBound)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {confidenceBadge(route.confidenceScore)}
                      </TableCell>
                      <TableCell className="text-center">
                        {route.isFallback ? (
                          <Badge variant="outline">Fallback</Badge>
                        ) : (
                          <Badge variant="secondary">Exact</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
