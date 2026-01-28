"use client";

import { Fragment, useState, useTransition, useRef } from "react";
import {
  Calculator,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TierBreakdown } from "@/components/tier-breakdown";
import {
  runBatchSimulation,
  runSimulation,
} from "@/app/simulator/_actions/simulate";

// ── Constants ──────────────────────────────────────────────────

const VEHICLE_TYPES = ["1t", "2.5t", "3.5t", "5t", "8t", "11t", "15t", "18t", "25t"];
const FREIGHT_TYPES = ["General", "Fragile", "Refrigerated", "Hazardous"];

const PRESET_ROUTES = [
  { label: "Seoul/Gangnam → Busan/Haeundae", origin: "Seoul/Gangnam", destination: "Busan/Haeundae" },
  { label: "Seoul/Gangseo → Daegu/Dalseo", origin: "Seoul/Gangseo", destination: "Daegu/Dalseo" },
  { label: "Incheon/Namdong → Gwangju/Buk", origin: "Incheon/Namdong", destination: "Gwangju/Buk" },
  { label: "Seoul/Songpa → Daejeon/Yuseong", origin: "Seoul/Songpa", destination: "Daejeon/Yuseong" },
  { label: "Gyeonggi/Pyeongtaek → Gyeongnam/Changwon", origin: "Gyeonggi/Pyeongtaek", destination: "Gyeongnam/Changwon" },
];

// ── Types ──────────────────────────────────────────────────────

interface RouteRow {
  id: string;
  origin: string;
  destination: string;
  vehicleType: string;
  freightType: string;
  manualAdj: string;
}

interface BatchError {
  index: number;
  route: string;
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────

function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function confidenceBadge(score: number) {
  const pct = `${(score * 100).toFixed(0)}%`;
  if (score >= 0.7) return <Badge variant="default">{pct}</Badge>;
  if (score >= 0.4) return <Badge variant="secondary">{pct}</Badge>;
  return <Badge variant="destructive">{pct}</Badge>;
}

function createEmptyRow(): RouteRow {
  return {
    id: crypto.randomUUID(),
    origin: "",
    destination: "",
    vehicleType: "11t",
    freightType: "General",
    manualAdj: "0",
  };
}

// ── CSV parsing for simulation requests ────────────────────────

function parseSimulationCsv(text: string): { rows: RouteRow[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV is empty or has no data rows."] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const originIdx = headers.findIndex((h) => ["origin", "departure", "from"].includes(h));
  const destIdx = headers.findIndex((h) => ["destination", "arrival", "to"].includes(h));
  const vehicleIdx = headers.findIndex((h) => ["vehicletype", "vehicle", "ton", "tontype"].includes(h));
  const freightIdx = headers.findIndex((h) => ["freighttype", "freight", "cargo", "cargotype"].includes(h));
  const adjIdx = headers.findIndex((h) => ["adjustment", "adj", "manualadjustment", "discount"].includes(h));

  if (originIdx === -1 || destIdx === -1) {
    return { rows: [], errors: [`Missing required columns: origin, destination. Found: ${lines[0]}`] };
  }

  const rows: RouteRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(",").map((f) => f.trim());
    const origin = fields[originIdx] ?? "";
    const destination = fields[destIdx] ?? "";

    if (!origin || !destination) {
      errors.push(`Row ${i + 1}: Missing origin or destination`);
      continue;
    }

    const vehicleType = vehicleIdx >= 0 ? (fields[vehicleIdx] || "11t") : "11t";
    const freightType = freightIdx >= 0 ? (fields[freightIdx] || "General") : "General";
    const manualAdj = adjIdx >= 0 ? (fields[adjIdx] || "0") : "0";

    rows.push({
      id: crypto.randomUUID(),
      origin,
      destination,
      vehicleType: VEHICLE_TYPES.includes(vehicleType) ? vehicleType : "11t",
      freightType: FREIGHT_TYPES.includes(freightType) ? freightType : "General",
      manualAdj,
    });
  }

  return { rows, errors };
}

// ── Excel (CSV) export ─────────────────────────────────────────

function exportResultsToCsv(results: any[]) {
  const headers = [
    "Origin",
    "Destination",
    "Vehicle",
    "Freight",
    "Distance (km)",
    "Tier 1 - Cost Base (KRW)",
    "Tier 2 - Market Adjusted (KRW)",
    "Tier 3 - Final Price (KRW)",
    "Company Margin (KRW)",
    "Freight Risk (KRW)",
    "Manual Adj (KRW)",
    "Confidence (%)",
    "Market Samples",
    "Fallback",
  ];

  const rows = results.map((r: any) => [
    r.input.origin,
    r.input.destination,
    r.input.vehicleType,
    r.input.freightType ?? "General",
    r.tier1.distanceKm,
    r.summary.tier1_base,
    r.summary.tier2_adjusted,
    r.summary.tier3_final,
    r.tier3.companyMargin,
    r.tier3.freightRiskSurcharge,
    r.tier3.manualAdjustment,
    Math.round(r.summary.overallConfidence * 100),
    r.tier2.sampleSize,
    r.tier2.isFallback ? "Yes" : "No",
  ]);

  const csvContent =
    "\uFEFF" + // BOM for Excel Korean support
    headers.join(",") +
    "\n" +
    rows.map((row: (string | number)[]) => row.map((v) => `"${v}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fph-batch-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────

export function BatchSimulator() {
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single mode state
  const [singleRow, setSingleRow] = useState<RouteRow>(createEmptyRow());
  const [singleResult, setSingleResult] = useState<any | null>(null);

  // Batch mode state
  const [rows, setRows] = useState<RouteRow[]>([createEmptyRow()]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchErrors, setBatchErrors] = useState<BatchError[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Shared
  const [isPending, startTransition] = useTransition();
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Single mode handlers ──────────────────────────────────

  function handlePreset(value: string) {
    const preset = PRESET_ROUTES.find((p) => p.label === value);
    if (preset) {
      setSingleRow((r) => ({ ...r, origin: preset.origin, destination: preset.destination }));
    }
  }

  function handleSingleSubmit() {
    if (!singleRow.origin.trim() || !singleRow.destination.trim()) return;
    startTransition(async () => {
      const res = await runSimulation({
        origin: singleRow.origin.trim(),
        destination: singleRow.destination.trim(),
        vehicleType: singleRow.vehicleType,
        freightType: singleRow.freightType,
        manualAdjustmentRate: parseFloat(singleRow.manualAdj) / 100 || 0,
      });
      setSingleResult(res);
    });
  }

  // ── Batch mode handlers ───────────────────────────────────

  function updateRow(id: string, field: keyof RouteRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  function applyPresetToRow(id: string, presetLabel: string) {
    const preset = PRESET_ROUTES.find((p) => p.label === presetLabel);
    if (preset) {
      updateRow(id, "origin", preset.origin);
      updateRow(id, "destination", preset.destination);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows: parsed, errors } = parseSimulationCsv(text);
      setCsvErrors(errors);
      if (parsed.length > 0) {
        setRows(parsed);
      }
    };
    reader.readAsText(file);
    // reset input so same file can be re-uploaded
    e.target.value = "";
  }

  function handleBatchSubmit() {
    const validRows = rows.filter((r) => r.origin.trim() && r.destination.trim());
    if (validRows.length === 0) return;

    startTransition(async () => {
      const inputs = validRows.map((r) => ({
        origin: r.origin.trim(),
        destination: r.destination.trim(),
        vehicleType: r.vehicleType,
        freightType: r.freightType,
        manualAdjustmentRate: parseFloat(r.manualAdj) / 100 || 0,
      }));

      const { results, errors } = await runBatchSimulation(inputs);
      setBatchResults(results);
      setBatchErrors(errors);
      setExpandedIdx(null);
    });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("single")}
        >
          Single Route
        </Button>
        <Button
          variant={mode === "batch" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("batch")}
        >
          Batch Simulation
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SINGLE MODE                                         */}
      {/* ════════════════════════════════════════════════════ */}
      {mode === "single" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Route Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Quick Select</Label>
                <Select onValueChange={handlePreset}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a preset route..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_ROUTES.map((r) => (
                      <SelectItem key={r.label} value={r.label}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="s-origin">Origin (City/District)</Label>
                  <Input
                    id="s-origin"
                    placeholder="e.g. Seoul/Gangnam"
                    value={singleRow.origin}
                    onChange={(e) => setSingleRow((r) => ({ ...r, origin: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="s-dest">Destination (City/District)</Label>
                  <Input
                    id="s-dest"
                    placeholder="e.g. Busan/Haeundae"
                    value={singleRow.destination}
                    onChange={(e) => setSingleRow((r) => ({ ...r, destination: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Vehicle Type</Label>
                  <Select
                    value={singleRow.vehicleType}
                    onValueChange={(v) => setSingleRow((r) => ({ ...r, vehicleType: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Freight Type</Label>
                  <Select
                    value={singleRow.freightType}
                    onValueChange={(v) => setSingleRow((r) => ({ ...r, freightType: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREIGHT_TYPES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="s-adj">Strategic Adjustment (%)</Label>
                  <Input
                    id="s-adj"
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={singleRow.manualAdj}
                    onChange={(e) => setSingleRow((r) => ({ ...r, manualAdj: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Negative = discount, positive = premium
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSingleSubmit}
                disabled={!singleRow.origin.trim() || !singleRow.destination.trim() || isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate FPH Price
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {singleResult && <TierBreakdown result={singleResult} />}
        </>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* BATCH MODE                                          */}
      {/* ════════════════════════════════════════════════════ */}
      {mode === "batch" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Batch Route Inputs</CardTitle>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    Upload CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Row
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {csvErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">CSV Import Warnings:</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      {csvErrors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {csvErrors.length > 5 && (
                        <li>...and {csvErrors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground">
                CSV format: <code>origin, destination, vehicleType, freightType, adjustment</code>
                &nbsp;(vehicleType, freightType, adjustment are optional)
              </p>

              {/* Column headers */}
              <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_110px_80px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Origin</span>
                <span>Destination</span>
                <span>Vehicle</span>
                <span>Freight</span>
                <span>Adj %</span>
                <span />
              </div>

              {/* Route rows */}
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_110px_80px_36px] gap-2 items-center rounded-md border p-2 md:p-1"
                >
                  <Input
                    placeholder="Origin"
                    value={row.origin}
                    onChange={(e) => updateRow(row.id, "origin", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Destination"
                    value={row.destination}
                    onChange={(e) => updateRow(row.id, "destination", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Select
                    value={row.vehicleType}
                    onValueChange={(v) => updateRow(row.id, "vehicleType", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={row.freightType}
                    onValueChange={(v) => updateRow(row.id, "freightType", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREIGHT_TYPES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={row.manualAdj}
                    onChange={(e) => updateRow(row.id, "manualAdj", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Preset quick-add */}
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-xs text-muted-foreground mr-1 self-center">Quick add:</span>
                {PRESET_ROUTES.map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      setRows((prev) => [
                        ...prev,
                        { ...createEmptyRow(), origin: p.origin, destination: p.destination },
                      ]);
                    }}
                  >
                    {p.origin.split("/")[0]} → {p.destination.split("/")[0]}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleBatchSubmit}
                disabled={!rows.some((r) => r.origin.trim() && r.destination.trim()) || isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating {rows.filter((r) => r.origin.trim() && r.destination.trim()).length} routes...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate All ({rows.filter((r) => r.origin.trim() && r.destination.trim()).length} routes)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Batch errors */}
          {batchErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">{batchErrors.length} route(s) failed:</p>
                <ul className="list-disc pl-4 text-xs mt-1">
                  {batchErrors.map((e, i) => (
                    <li key={i}>
                      {e.route}: {e.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Results comparison table */}
          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Results ({batchResults.length} route{batchResults.length !== 1 ? "s" : ""})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResultsToCsv(batchResults)}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Export to Excel (CSV)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3 font-medium">Route</th>
                        <th className="pb-2 pr-3 font-medium">Vehicle</th>
                        <th className="pb-2 pr-3 font-medium text-right">Tier 1 (Cost)</th>
                        <th className="pb-2 pr-3 font-medium text-right">Tier 2 (Market)</th>
                        <th className="pb-2 pr-3 font-medium text-right">Tier 3 (Final)</th>
                        <th className="pb-2 pr-3 font-medium text-center">Confidence</th>
                        <th className="pb-2 font-medium text-center">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResults.map((r: any, idx: number) => (
                        <Fragment key={`group-${idx}`}>
                          <tr
                            className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                          >
                            <td className="py-2 pr-3">
                              <div className="font-medium">
                                {r.input.origin.split("/")[0]} → {r.input.destination.split("/")[0]}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {r.input.origin} → {r.input.destination}
                              </div>
                            </td>
                            <td className="py-2 pr-3">
                              <Badge variant="outline" className="text-xs">
                                {r.input.vehicleType}
                              </Badge>
                              {r.input.freightType && r.input.freightType !== "General" && (
                                <Badge variant="secondary" className="text-xs ml-1">
                                  {r.input.freightType}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-right font-mono text-indigo-600">
                              {formatKRW(r.summary.tier1_base)}
                            </td>
                            <td className="py-2 pr-3 text-right font-mono text-green-600">
                              {formatKRW(r.summary.tier2_adjusted)}
                            </td>
                            <td className="py-2 pr-3 text-right font-mono font-bold text-amber-600">
                              {formatKRW(r.summary.tier3_final)}
                            </td>
                            <td className="py-2 pr-3 text-center">
                              {confidenceBadge(r.summary.overallConfidence)}
                            </td>
                            <td className="py-2 text-center">
                              {expandedIdx === idx ? (
                                <ChevronUp className="h-4 w-4 mx-auto text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 mx-auto text-muted-foreground" />
                              )}
                            </td>
                          </tr>
                          {expandedIdx === idx && (
                            <tr>
                              <td colSpan={7} className="py-4 px-2 bg-muted/30">
                                <TierBreakdown result={r} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary row */}
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total routes: </span>
                    <span className="font-semibold">{batchResults.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Final Price: </span>
                    <span className="font-mono font-semibold text-amber-600">
                      {formatKRW(
                        Math.round(
                          batchResults.reduce((s: number, r: any) => s + r.summary.tier3_final, 0) /
                            batchResults.length
                        )
                      )}{" "}
                      KRW
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price Range: </span>
                    <span className="font-mono">
                      {formatKRW(Math.min(...batchResults.map((r: any) => r.summary.tier3_final)))}
                      {" ~ "}
                      {formatKRW(Math.max(...batchResults.map((r: any) => r.summary.tier3_final)))}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Confidence: </span>
                    {confidenceBadge(
                      batchResults.reduce((s: number, r: any) => s + r.summary.overallConfidence, 0) /
                        batchResults.length
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
