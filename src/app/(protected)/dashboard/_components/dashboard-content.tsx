// src/app/(protected)/dashboard/_components/dashboard-content.tsx
import { getDashboardData } from "@/actions/dashboard";

import { ChartsSection } from "./charts-section";
import { InstancesOverview } from "./instances-overview";
import { MetricsCards } from "./metrics-cards";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";

interface DashboardContentProps {
  userId: string;
}

export async function DashboardContent({ userId }: DashboardContentProps) {
  const result = await getDashboardData();

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">Erro ao carregar dados</h3>
          <p className="text-muted-foreground">
            {result.error || "Tente recarregar a página"}
          </p>
        </div>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <MetricsCards instances={data.instances} metrics={data.metrics} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts Section */}
        <div className="col-span-4 space-y-6">
          <ChartsSection chartData={data.chartData} />
          <InstancesOverview instances={data.instancesList} />
        </div>

        {/* Sidebar */}
        <div className="col-span-3 space-y-6">
          <QuickActions />
          <RecentActivity activities={data.recentActivities} />
        </div>
      </div>
    </div>
  );
}
