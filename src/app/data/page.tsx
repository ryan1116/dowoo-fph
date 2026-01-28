import { getDataStats } from "@/app/data/_actions/upload";
import { DataPageClient } from "@/components/data-page-client";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  const stats = await getDataStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
        <p className="text-muted-foreground">
          Import and manage historical market data, cost variables, and route
          standards.
        </p>
      </div>
      <DataPageClient initialStats={stats} />
    </div>
  );
}
