"use client";

import { useState, useTransition } from "react";
import { Calculator, Loader2 } from "lucide-react";
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
import { TierBreakdown } from "@/components/tier-breakdown";
import { runSimulation } from "@/app/simulator/_actions/simulate";
import type { FPHResult } from "@/lib/pricing-engine";

const VEHICLE_TYPES = ["1t", "2.5t", "3.5t", "5t", "8t", "11t", "15t", "18t", "25t"];
const FREIGHT_TYPES = ["General", "Fragile", "Refrigerated", "Hazardous"];

const PRESET_ROUTES = [
  { label: "Seoul/Gangnam → Busan/Haeundae", origin: "Seoul/Gangnam", destination: "Busan/Haeundae" },
  { label: "Seoul/Gangseo → Daegu/Dalseo", origin: "Seoul/Gangseo", destination: "Daegu/Dalseo" },
  { label: "Incheon/Namdong → Gwangju/Buk", origin: "Incheon/Namdong", destination: "Gwangju/Buk" },
  { label: "Seoul/Songpa → Daejeon/Yuseong", origin: "Seoul/Songpa", destination: "Daejeon/Yuseong" },
  { label: "Gyeonggi/Pyeongtaek → Gyeongnam/Changwon", origin: "Gyeonggi/Pyeongtaek", destination: "Gyeongnam/Changwon" },
];

export function SimulatorForm() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("11t");
  const [freightType, setFreightType] = useState("General");
  const [manualAdj, setManualAdj] = useState("0");
  const [result, setResult] = useState<FPHResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePreset(value: string) {
    const preset = PRESET_ROUTES.find((p) => p.label === value);
    if (preset) {
      setOrigin(preset.origin);
      setDestination(preset.destination);
    }
  }

  function handleSubmit() {
    if (!origin.trim() || !destination.trim()) return;

    startTransition(async () => {
      const res = await runSimulation({
        origin: origin.trim(),
        destination: destination.trim(),
        vehicleType,
        freightType,
        manualAdjustmentRate: parseFloat(manualAdj) / 100 || 0,
      });
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Route Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset routes */}
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
              <Label htmlFor="origin">Origin (City/District)</Label>
              <Input
                id="origin"
                placeholder="e.g. Seoul/Gangnam"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination (City/District)</Label>
              <Input
                id="destination"
                placeholder="e.g. Busan/Haeundae"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Freight Type</Label>
              <Select value={freightType} onValueChange={setFreightType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREIGHT_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adj">Strategic Adjustment (%)</Label>
              <Input
                id="adj"
                type="number"
                step="0.5"
                placeholder="0"
                value={manualAdj}
                onChange={(e) => setManualAdj(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Negative = discount, positive = premium
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!origin.trim() || !destination.trim() || isPending}
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

      {result && <TierBreakdown result={result} />}
    </div>
  );
}
