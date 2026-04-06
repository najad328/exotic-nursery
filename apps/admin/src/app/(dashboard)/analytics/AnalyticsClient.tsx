"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineSeries, HistogramSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";

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

function formatRevenue(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// ---------- TradingView Lightweight Chart Wrappers ----------

function OrdersChart({ data }: { data: DailyData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#F1F5F9" },
        horzLines: { color: "#F1F5F9" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: "#1B5E2040", width: 1, style: 3, labelBackgroundColor: "#1B5E20" },
        horzLine: { color: "#1B5E2040", width: 1, style: 3, labelBackgroundColor: "#1B5E20" },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series: ISeriesApi<"Histogram"> = chart.addSeries(HistogramSeries, {
      color: "#1B5E20",
      priceFormat: { type: "volume" },
    });

    series.setData(
      data.map((d) => ({
        time: d.date as Time,
        value: d.orders,
        color: d.orders > 0 ? "#1B5E20" : "#E2E8F0",
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}

function RevenueChart({ data }: { data: DailyData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#F1F5F9" },
        horzLines: { color: "#F1F5F9" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: "#2E7D3240", width: 1, style: 3, labelBackgroundColor: "#2E7D32" },
        horzLine: { color: "#2E7D3240", width: 1, style: 3, labelBackgroundColor: "#2E7D32" },
      },
      localization: {
        priceFormatter: (price: number) => formatRevenue(price),
      },
      handleScroll: false,
      handleScale: false,
    });

    const series: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
      color: "#2E7D32",
      lineWidth: 2,
      crosshairMarkerBackgroundColor: "#2E7D32",
      crosshairMarkerBorderColor: "#ffffff",
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerRadius: 5,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    series.setData(
      data.map((d) => ({
        time: d.date as Time,
        value: d.revenue / 100, // convert paise to rupees
      }))
    );

    // Area fill under line via baseline series would be ideal,
    // but simple line is cleaner for a dashboard
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}

// ---------- Custom CSS Charts ----------

function TopPlantsChart({ data }: { data: TopPlant[] }) {
  const maxSold = Math.max(...data.map((d) => d.sold), 1);

  return (
    <div className="space-y-3">
      {data.map((plant, idx) => (
        <div key={plant.name} className="group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {plant.name}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className="text-xs text-gray-400">
                {formatRevenue(plant.revenue)}
              </span>
              <span className="text-sm font-bold text-gray-800 tabular-nums w-8 text-right">
                {plant.sold}
              </span>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-7">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(plant.sold / maxSold) * 100}%`,
                background: `linear-gradient(90deg, #1B5E20 0%, #43A047 100%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Build conic gradient segments
  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    const pct = (d.count / total) * 100;
    cumulative += pct;
    return { ...d, start, end: cumulative, pct };
  });

  const conicGradient = segments
    .map(
      (s) =>
        `${STATUS_COLORS[s.status] ?? "#94A3B8"} ${s.start}% ${s.end}%`
    )
    .join(", ");

  return (
    <div className="flex items-center gap-8">
      {/* Donut */}
      <div className="relative shrink-0">
        <div
          className="w-44 h-44 rounded-full"
          style={{
            background: `conic-gradient(${conicGradient})`,
          }}
        >
          <div className="absolute inset-5 rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{total}</span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1 min-w-0">
        {segments.map((s, idx) => (
          <div
            key={s.status}
            className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors cursor-default ${
              hoveredIdx === idx ? "bg-gray-50" : ""
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#94A3B8" }}
            />
            <span className="text-sm text-gray-600 capitalize truncate flex-1">
              {s.status}
            </span>
            <span className="text-sm font-semibold text-gray-800 tabular-nums">
              {s.count}
            </span>
            <span className="text-xs text-gray-400 tabular-nums w-10 text-right">
              {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Main Component ----------

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
      {/* Time-series charts */}
      {dailyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Daily Orders" subtitle="Last 30 days">
            <OrdersChart data={dailyData} />
          </ChartCard>
          <ChartCard title="Revenue Trend" subtitle="Last 30 days">
            <RevenueChart data={dailyData} />
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topPlants.length > 0 && (
          <ChartCard title="Top Selling Plants" subtitle={`${topPlants.length} plants by units sold`}>
            <TopPlantsChart data={topPlants} />
          </ChartCard>
        )}

        {statusBreakdown.length > 0 && (
          <ChartCard title="Order Status" subtitle="All-time breakdown">
            <StatusDonut data={statusBreakdown} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
