import { createSupabaseServerClient } from "../../lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { count: plantCount } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: categoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Plants"
          value={plantCount ?? 0}
          icon="🌱"
          description="Products in catalog"
        />
        <StatCard
          title="Categories"
          value={categoryCount ?? 0}
          icon="📂"
          description="Active categories"
        />
        <StatCard
          title="Orders"
          value={0}
          icon="📦"
          description="Coming in Phase 3"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAction
          title="Manage Plants"
          description="Add, edit, or deactivate plants in your catalog"
          href="/plants"
          icon="🌿"
        />
        <QuickAction
          title="Bulk Upload"
          description="Upload plants via CSV or JSON file"
          href="/plants/upload"
          icon="📤"
        />
        <QuickAction
          title="View Orders"
          description="Track and manage customer orders"
          href="/orders"
          icon="📋"
          disabled
        />
        <QuickAction
          title="Analytics"
          description="View sales trends and top-selling plants"
          href="/analytics"
          icon="📊"
          disabled
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-500">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-green-300 transition-colors block"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
