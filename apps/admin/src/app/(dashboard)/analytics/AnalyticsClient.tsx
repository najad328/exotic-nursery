"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DailyData {
  date: string;
  orders: number;
  revenue: number;
}

interface TopPlant {
  name: string;
  sold: number;
  revenue: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  processing: "#6366F1",
  shipped: "#8B5CF6",
  "out for delivery": "#F97316",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const PIE_COLORS = ["#F59E0B", "#3B82F6", "#6366F1", "#8B5CF6", "#F97316", "#10B981", "#EF4444"];

function formatRevenue(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function AnalyticsClient({
  dailyData,
  topPlants,
  statusBreakdown,
}: {
  dailyData: DailyData[];
  topPlants: TopPlant[];
  statusBreakdown: StatusBreakdown[];
}) {
  const hasData = dailyData.length > 0 || topPlants.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-500 text-lg">No order data yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Charts will appear once customers start placing orders
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue + Orders over time */}
      {dailyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Daily Orders (Last 30 Days)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN")}
                />
                <Bar dataKey="orders" fill="#1B5E20" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Revenue (Last 30 Days)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatRevenue} />
                <Tooltip
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN")}
                  formatter={(value: number) => [formatRevenue(value), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1B5E20"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Plants */}
        {topPlants.length > 0 && (
          <ChartCard title="Top Selling Plants">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPlants} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip formatter={(value: number) => [value, "Sold"]} />
                <Bar dataKey="sold" fill="#2E7D32" radius={[0, 4, 4, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Order Status Breakdown */}
        {statusBreakdown.length > 0 && (
          <ChartCard title="Order Status Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }: { status: string; count: number }) =>
                    `${status} (${count})`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}
