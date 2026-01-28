import { BatchSimulator } from "@/components/batch-simulator";

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Price Simulator</h2>
        <p className="text-muted-foreground">
          Calculate single or batch prices using the FPH 3-tier framework.
        </p>
      </div>
      <BatchSimulator />
    </div>
  );
}
