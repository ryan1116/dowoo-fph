import {
  BookOpen,
  Layers,
  BarChart3,
  Shield,
  Database,
  Settings,
  Upload,
  Calculator,
  Download,
  ArrowRight,
  Fuel,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold">{children}</h3>
    </div>
  );
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-md border bg-muted/50 px-4 py-3 font-mono text-sm overflow-x-auto">
      {children}
    </div>
  );
}

function StepItem({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {step}
      </div>
      <div className="pt-0.5">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{children}</p>
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Guide</h2>
        <p className="text-muted-foreground">
          Comprehensive documentation for the Dowoo FPH Standard Pricing System.
        </p>
      </div>

      <Tabs defaultValue="introduction" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="introduction">Introduction</TabsTrigger>
          <TabsTrigger value="tiers">3-Tier Logic</TabsTrigger>
          <TabsTrigger value="data">Data & Variables</TabsTrigger>
          <TabsTrigger value="howto">How to Use</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════ */}
        {/* INTRODUCTION                                        */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="introduction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Purpose of the FPH System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                The <strong>Fundamental Pricing Hierarchy (FPH)</strong> system
                replaces traditional experience-based and intuition-driven
                logistics pricing with a transparent, data-driven approach.
              </p>
              <p>
                In Korea's domestic freight industry, pricing has historically
                relied on individual negotiation and driver instinct. This leads
                to inconsistent quotes, unpredictable margins, and lost revenue.
                The FPH system addresses these issues by establishing a
                standardized, three-tiered pricing framework grounded in
                verifiable cost data and market intelligence.
              </p>

              <div className="grid gap-3 md:grid-cols-3 mt-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">Tier 1</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost-Based Foundation
                  </p>
                  <p className="text-xs mt-2">
                    Fuel, toll, fixed costs, and driver profit
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">Tier 2</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Market Overlay
                  </p>
                  <p className="text-xs mt-2">
                    IQR-cleaned historical median adjustment
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">Tier 3</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strategic Finalization
                  </p>
                  <p className="text-xs mt-2">
                    Margins, risk surcharges, and rounding
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  KEY BENEFITS
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span>Consistent, reproducible pricing across all routes and operators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span>Transparent cost breakdown visible at every tier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span>Confidence scoring tells you how reliable each quote is</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span>Automatic outlier removal prevents skewed market data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span>Strategic controls for company margins and freight risk premiums</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* 3-TIER LOGIC                                        */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="tiers" className="space-y-4">
          {/* Tier 1 */}
          <Card className="border-indigo-200 dark:border-indigo-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge className="bg-indigo-600">Tier 1</Badge>
                Cost-Based Foundation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Tier 1 calculates the absolute minimum cost to transport freight
                on a given route. It uses real operational costs from the
                CostMaster database.
              </p>

              <FormulaBlock>
                Operating Cost = Fuel Cost + Toll Cost + Fixed Cost
                <br />
                Fuel Cost = (Distance / Fuel Efficiency) x Fuel Price
                <br />
                Toll Cost = Distance x Toll Rate
                <br />
                Driver Profit = Operating Cost x Driver Profit Rate
                <br />
                <strong>Tier 1 Base = Operating Cost + Driver Profit</strong>
              </FormulaBlock>

              <Accordion type="single" collapsible>
                <AccordionItem value="vehicle-eff">
                  <AccordionTrigger className="text-sm">
                    Vehicle Fuel Efficiency Table
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        ["1t", "8.0 km/L"],
                        ["2.5t", "6.5 km/L"],
                        ["3.5t", "5.5 km/L"],
                        ["5t", "4.5 km/L"],
                        ["8t", "4.0 km/L"],
                        ["11t", "3.5 km/L"],
                        ["15t", "3.0 km/L"],
                        ["18t", "2.8 km/L"],
                        ["25t", "2.5 km/L"],
                      ].map(([type, eff]) => (
                        <div key={type} className="flex justify-between rounded border px-2 py-1.5">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{eff}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="distance">
                  <AccordionTrigger className="text-sm">
                    Route Distance Calculation
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <p>
                      Distance is determined by a lookup table of 35+ major Korean
                      freight corridors. If the route is not found in the table, the
                      system falls back to a Haversine formula (great-circle distance
                      multiplied by a 1.3x road factor). Routes within the same
                      province default to 30 km.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Tier 2 */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge className="bg-green-600">Tier 2</Badge>
                Market Overlay
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Tier 2 adjusts the cost-based price using real historical market
                data. It uses the <strong>Interquartile Range (IQR)</strong> method
                to remove outliers, then calculates a confidence-weighted blend.
              </p>

              <FormulaBlock>
                Q1 = 25th percentile, Q3 = 75th percentile
                <br />
                IQR = Q3 - Q1
                <br />
                Valid range: [Q1 - 1.5 x IQR, Q3 + 1.5 x IQR]
                <br />
                Median = middle value of cleaned data
                <br />
                <br />
                <strong>
                  Tier 2 Price = Tier1 x (1 - Confidence) + Median x Confidence
                </strong>
              </FormulaBlock>

              <Accordion type="single" collapsible>
                <AccordionItem value="confidence">
                  <AccordionTrigger className="text-sm">
                    Confidence Score Calculation
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Confidence is derived from two factors:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Sample size factor (60% weight):</strong> min(sampleSize / 30, 1.0).
                        Reaches maximum confidence at 30+ data points.
                      </li>
                      <li>
                        <strong>Consistency factor (40% weight):</strong> Based on coefficient
                        of variation (CV = stdDev / mean). Lower CV means more consistent data.
                      </li>
                    </ul>
                    <p>
                      If province-level fallback data is used instead of exact route data,
                      the confidence score is penalized by a 0.7x multiplier.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fallback">
                  <AccordionTrigger className="text-sm">
                    Province-Level Fallback Strategy
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <p>
                      When a specific route (e.g., Seoul/Gangnam to Busan/Haeundae)
                      has fewer than 5 data points, the system automatically aggregates
                      all routes between the same provinces (Seoul to Busan) to form a
                      broader market reference. This fallback is flagged in the results
                      and carries a reduced confidence score.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Tier 3 */}
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge className="bg-amber-600">Tier 3</Badge>
                Strategic Finalization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Tier 3 applies business-level adjustments to produce the final
                quoted price. This includes company margins, cargo risk premiums,
                and optional strategic overrides.
              </p>

              <FormulaBlock>
                Company Margin = Tier 2 Price x Margin Rate (default 8%)
                <br />
                Freight Risk = Tier 2 Price x Risk Rate
                <br />
                Manual Adj = Tier 2 Price x Manual Rate
                <br />
                Subtotal = Tier 2 + Margin + Risk + Manual
                <br />
                <strong>Final Price = ceil(Subtotal / 1,000) x 1,000 KRW</strong>
              </FormulaBlock>

              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  FREIGHT RISK SURCHARGES
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <Badge variant="outline">General</Badge>
                    <span>0%</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <Badge variant="secondary">Fragile</Badge>
                    <span>12%</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <Badge variant="secondary">Refrigerated</Badge>
                    <span>15%</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <Badge variant="destructive">Hazardous</Badge>
                    <span>20%</span>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="rounding">
                  <AccordionTrigger className="text-sm">
                    Rounding Policy
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <p>
                      All final prices are rounded <strong>up</strong> to the nearest
                      1,000 KRW. For example, 850,001 KRW becomes 851,000 KRW, while
                      850,000 KRW stays unchanged. This ensures the company never
                      under-quotes due to fractional calculations.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="strategic">
                  <AccordionTrigger className="text-sm">
                    Strategic Adjustment
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <p>
                      Users can apply a manual percentage adjustment to the final
                      price. A negative value (e.g., -5%) acts as a strategic
                      discount for high-volume clients, while a positive value
                      (e.g., +3%) applies a premium for rush or peak-season deliveries.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Overall Confidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                Overall Confidence Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed space-y-2">
              <p>
                The final confidence score combines distance reliability and market
                data quality:
              </p>
              <FormulaBlock>
                Overall = Distance Confidence x 30% + Market Confidence x 70%
              </FormulaBlock>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border p-2 text-center">
                  <Badge variant="default" className="mb-1">70%+</Badge>
                  <p className="text-muted-foreground">High confidence</p>
                </div>
                <div className="rounded border p-2 text-center">
                  <Badge variant="secondary" className="mb-1">40-69%</Badge>
                  <p className="text-muted-foreground">Moderate</p>
                </div>
                <div className="rounded border p-2 text-center">
                  <Badge variant="destructive" className="mb-1">&lt;40%</Badge>
                  <p className="text-muted-foreground">Low confidence</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Distance confidence is 100% for lookup-table routes and 60% for
                Haversine-estimated routes. Market confidence is 30% when no market
                data is available.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* DATA & VARIABLES                                    */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5" />
                Market Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed space-y-3">
              <p>
                Market Data consists of historical freight pricing records
                collected from actual transactions. Each record captures:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Field</th>
                      <th className="pb-2 pr-3 font-medium">Example</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr><td className="py-1.5 pr-3 font-mono">date</td><td className="py-1.5 pr-3">2024-06-15</td><td className="py-1.5 text-muted-foreground">Transaction date</td></tr>
                    <tr><td className="py-1.5 pr-3 font-mono">origin</td><td className="py-1.5 pr-3">Seoul/Gangnam</td><td className="py-1.5 text-muted-foreground">City/District format</td></tr>
                    <tr><td className="py-1.5 pr-3 font-mono">destination</td><td className="py-1.5 pr-3">Busan/Haeundae</td><td className="py-1.5 text-muted-foreground">City/District format</td></tr>
                    <tr><td className="py-1.5 pr-3 font-mono">vehicleType</td><td className="py-1.5 pr-3">11t</td><td className="py-1.5 text-muted-foreground">Truck tonnage class</td></tr>
                    <tr><td className="py-1.5 pr-3 font-mono">freightType</td><td className="py-1.5 pr-3">General</td><td className="py-1.5 text-muted-foreground">Cargo classification</td></tr>
                    <tr><td className="py-1.5 pr-3 font-mono">unitPrice</td><td className="py-1.5 pr-3">850000</td><td className="py-1.5 text-muted-foreground">Actual price (KRW)</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                The system requires at least 5 records per route for direct
                analysis. Below that threshold, data is aggregated at the
                province level as a fallback.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5" />
                Cost Master Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed space-y-3">
              <p>
                CostMaster stores the operational variables used by the pricing
                engine. These can be edited from the Settings page.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Category</th>
                      <th className="pb-2 pr-3 font-medium">Variable</th>
                      <th className="pb-2 pr-3 font-medium">Default</th>
                      <th className="pb-2 font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Variable</Badge></td><td className="py-1.5 pr-3 font-mono">fuel_price</td><td className="py-1.5 pr-3">1,650 KRW/L</td><td className="py-1.5 text-muted-foreground">Diesel price per liter</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Variable</Badge></td><td className="py-1.5 pr-3 font-mono">fuel_efficiency</td><td className="py-1.5 pr-3">3.5 km/L</td><td className="py-1.5 text-muted-foreground">Default efficiency (overridden per vehicle)</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Variable</Badge></td><td className="py-1.5 pr-3 font-mono">toll_rate</td><td className="py-1.5 pr-3">120 KRW/km</td><td className="py-1.5 text-muted-foreground">Average toll cost per km</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Fixed</Badge></td><td className="py-1.5 pr-3 font-mono">vehicle_fixed_cost</td><td className="py-1.5 pr-3">150,000 KRW</td><td className="py-1.5 text-muted-foreground">Depreciation + insurance per trip</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Policy</Badge></td><td className="py-1.5 pr-3 font-mono">driver_profit_rate</td><td className="py-1.5 pr-3">15%</td><td className="py-1.5 text-muted-foreground">Guaranteed driver income share</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Policy</Badge></td><td className="py-1.5 pr-3 font-mono">company_margin_rate</td><td className="py-1.5 pr-3">8%</td><td className="py-1.5 text-muted-foreground">Dowoo Logistics profit margin</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Risk</Badge></td><td className="py-1.5 pr-3 font-mono">freight_risk_fragile</td><td className="py-1.5 pr-3">12%</td><td className="py-1.5 text-muted-foreground">Surcharge for fragile goods</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Risk</Badge></td><td className="py-1.5 pr-3 font-mono">freight_risk_refrigerated</td><td className="py-1.5 pr-3">15%</td><td className="py-1.5 text-muted-foreground">Surcharge for cold chain</td></tr>
                    <tr><td className="py-1.5 pr-3"><Badge variant="outline" className="text-xs">Risk</Badge></td><td className="py-1.5 pr-3 font-mono">freight_risk_hazardous</td><td className="py-1.5 pr-3">20%</td><td className="py-1.5 text-muted-foreground">Surcharge for dangerous goods</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* HOW TO USE                                          */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="howto" className="space-y-4">
          {/* Single Simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-5 w-5" />
                Single Route Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <StepItem step={1} title="Navigate to Price Simulator">
                Click &quot;Price Simulator&quot; in the sidebar. Ensure &quot;Single Route&quot; mode is selected.
              </StepItem>
              <StepItem step={2} title="Enter route parameters">
                Use a preset route or type the origin and destination in
                City/District format (e.g., Seoul/Gangnam). Select the vehicle
                tonnage and freight type.
              </StepItem>
              <StepItem step={3} title="Set strategic adjustment (optional)">
                Enter a percentage to apply a discount (negative) or premium
                (positive). Leave at 0 for standard pricing.
              </StepItem>
              <StepItem step={4} title="Calculate and review">
                Click &quot;Calculate FPH Price&quot;. The result shows a bar chart
                comparing all three tiers and detailed breakdowns for each tier
                including confidence scores.
              </StepItem>
            </CardContent>
          </Card>

          {/* Batch Simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5" />
                Batch Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <StepItem step={1} title="Switch to Batch mode">
                On the Price Simulator page, click the &quot;Batch Simulation&quot; toggle button.
              </StepItem>
              <StepItem step={2} title="Add routes">
                Add rows manually using &quot;Add Row&quot;, use the preset
                quick-add buttons, or upload a CSV file with the &quot;Upload
                CSV&quot; button.
              </StepItem>
              <StepItem step={3} title="Calculate all routes">
                Click &quot;Calculate All&quot; to process every route through
                the FPH engine simultaneously. Results appear in a comparison
                table.
              </StepItem>
              <StepItem step={4} title="Review and export">
                Click any row to expand the full tier breakdown. Use
                &quot;Export to Excel (CSV)&quot; to download results for
                reporting.
              </StepItem>

              <div className="rounded-lg border bg-muted/30 p-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  CSV FORMAT FOR BATCH UPLOAD
                </p>
                <code className="text-xs block bg-background rounded px-2 py-1.5 border">
                  origin, destination, vehicleType, freightType, adjustment
                  <br />
                  Seoul/Gangnam, Busan/Haeundae, 11t, General, 0
                  <br />
                  Incheon/Namdong, Gwangju/Buk, 5t, Fragile, -5
                </code>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Only <strong>origin</strong> and <strong>destination</strong> are
                  required. Other columns default to 11t, General, and 0%
                  adjustment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <StepItem step={1} title="Navigate to Data Management">
                Click &quot;Data Management&quot; in the sidebar to access the
                import and statistics interface.
              </StepItem>
              <StepItem step={2} title="Upload Market Data CSV">
                Use the &quot;Market Data&quot; tab to drag-and-drop or browse
                for a CSV file containing historical pricing records. The system
                accepts flexible column names (e.g., &quot;departure&quot; maps
                to &quot;origin&quot;, &quot;fare&quot; maps to
                &quot;unitPrice&quot;).
              </StepItem>
              <StepItem step={3} title="Upload Cost Master CSV (optional)">
                Switch to the &quot;Cost Master&quot; tab to bulk-import cost
                variables. Existing variables are updated (upserted) by item
                name.
              </StepItem>
              <StepItem step={4} title="Verify statistics">
                After import, the Statistics tab shows record counts, IQR
                analysis results, and route coverage summaries.
              </StepItem>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5" />
                Managing Cost Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <StepItem step={1} title="Navigate to Settings">
                Click &quot;Settings&quot; in the sidebar to access the
                CostMaster variable editor.
              </StepItem>
              <StepItem step={2} title="Edit existing variables">
                Click the edit icon next to any variable to modify its value,
                unit, or description inline. Changes take effect immediately
                on the next simulation.
              </StepItem>
              <StepItem step={3} title="Add new variables">
                Use the &quot;Add Variable&quot; form at the bottom of the table
                to create custom cost entries. Select the appropriate category
                (Variable, Fixed, Policy, or Risk).
              </StepItem>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
