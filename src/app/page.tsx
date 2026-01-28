import {
  Calculator,
  Database,
  Settings,
  Fuel,
  TrendingUp,
  Truck,
  BarChart3,
  Route,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/app/_actions/dashboard";

export const dynamic = "force-dynamic";

const navCards = [
  {
    title: "Price Simulator",
    description:
      "Calculate standard prices using the FPH 3-tier framework: Cost Base, Market Overlay, and Strategic Adjustment.",
    href: "/simulator",
    icon: Calculator,
  },
  {
    title: "Data Management",
    description:
      "Import and manage historical market data (CSV), cost variables, and route standards.",
    href: "/data",
    icon: Database,
  },
  {
    title: "Settings",
    description:
      "Configure cost master variables, profit margins, risk factors, and system policies.",
    href: "/settings",
    icon: Settings,
  },
];

function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export default async function Home() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Market Data Records",
      value: stats.marketDataCount.toLocaleString(),
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      label: "Unique Routes",
      value: stats.uniqueRoutes.toString(),
      icon: Route,
      color: "text-green-600",
    },
    {
      label: "Cost Variables",
      value: stats.costMasterCount.toString(),
      icon: Settings,
      color: "text-purple-600",
    },
    {
      label: "Route Standards",
      value: stats.routeStandardCount.toString(),
      icon: Truck,
      color: "text-orange-600",
    },
  ];

  const keyMetrics = [
    {
      label: "Fuel Price (Diesel)",
      value: stats.fuelPrice ? `${formatKRW(stats.fuelPrice)} KRW/L` : "Not set",
      icon: Fuel,
    },
    {
      label: "Company Margin",
      value: stats.companyMargin ? `${(stats.companyMargin * 100).toFixed(0)}%` : "Not set",
      icon: TrendingUp,
    },
    {
      label: "Driver Profit",
      value: stats.driverProfit ? `${(stats.driverProfit * 100).toFixed(0)}%` : "Not set",
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Dowoo Logistics Fundamental Pricing Hierarchy (FPH) System
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {keyMetrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
            >
              <metric.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="font-semibold">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Access</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {navCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3 mb-3">
                <card.icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
