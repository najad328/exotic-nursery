import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { AnalyticsClient } from "./AnalyticsClient";
import { formatPrice } from "@exotic-nursery/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  // KPIs
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { data: revenueData } = await supabase
    .from("orders")
    .select("total_paise")
    .neq("status", "cancelled");

  const totalRevenue = revenueData?.reduce((sum, o) => sum + o.total_paise, 0) ?? 0;
  const avgOrder = totalOrders && totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const { count: totalCustomers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  const { count: activePlants } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Chart data — daily orders (last 30 days)
  const { data: dailyOrders } = await supabase
    .from("orders")
    .select("created_at, total_paise, status")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at");

  // Aggregate daily
  const dailyMap = new Map<string, { date: string; orders: number; revenue: number }>();
  for (const order of dailyOrders ?? []) {
    const date = new Date(order.created_at).toISOString().split("T")[0]!;
    const existing = dailyMap.get(date) ?? { date, orders: 0, revenue: 0 };
    existing.orders += 1;
    if (order.status !== "cancelled") {
      existing.revenue += order.total_paise;
    }
    dailyMap.set(date, existing);
  }
  const dailyChartData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Top selling plants
  const { data: topPlantsRaw } = await supabase
    .from("order_items")
    .select("plant_name, quantity, price_paise, order_id");

  const plantSalesMap = new Map<string, { name: string; sold: number; revenue: number }>();
  for (const item of topPlantsRaw ?? []) {
    const existing = plantSalesMap.get(item.plant_name) ?? { name: item.plant_name, sold: 0, revenue: 0 };
    existing.sold += item.quantity;
    existing.revenue += item.quantity * item.price_paise;
    plantSalesMap.set(item.plant_name, existing);
  }
  const topPlants = Array.from(plantSalesMap.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);

  // Order status breakdown
  const { data: allOrders } = await supabase
    .from("orders")
    .select("status");

  const statusMap = new Map<string, number>();
  for (const order of allOrders ?? []) {
    statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
  }
  const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard title="Total Revenue" value={formatPrice(totalRevenue)} icon="💰" color="green" />
        <KPICard title="Total Orders" value={String(totalOrders ?? 0)} icon="📦" color="blue" />
        <KPICard title="Avg Order" value={formatPrice(avgOrder)} icon="📊" color="purple" />
        <KPICard title="Customers" value={String(totalCustomers ?? 0)} icon="👥" color="amber" />
        <KPICard title="Active Plants" value={String(activePlants ?? 0)} icon="🌿" color="emerald" />
      </div>

      {/* Charts */}
      <AnalyticsClient
        dailyData={dailyChartData}
        topPlants={topPlants}
        statusBreakdown={statusBreakdown}
      />
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    green: "bg-green-50 border-green-100",
    blue: "bg-blue-50 border-blue-100",
    purple: "bg-purple-50 border-purple-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div className={`rounded-xl border p-5 ${bgColors[color] ?? "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-500 font-medium">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
