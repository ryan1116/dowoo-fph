import { getCostMasterItems } from "@/app/settings/_actions/cost-master";
import { CostMasterTable } from "@/components/cost-master-table";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const items = await getCostMasterItems();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure cost master variables, profit margins, risk factors, and
          system policies.
        </p>
      </div>
      <CostMasterTable initialItems={items} />
    </div>
  );
}
