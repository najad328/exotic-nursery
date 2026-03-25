import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { count: plantCount } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: categoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Exotic Nursery Admin</h1>
            <p className="text-green-200 text-sm mt-1">
              Welcome back, {profile?.full_name || "Admin"}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
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
            available={false}
          />
          <QuickAction
            title="View Orders"
            description="Track and manage customer orders"
            href="/orders"
            icon="📋"
            available={false}
          />
          <QuickAction
            title="Analytics"
            description="View sales trends and top-selling plants"
            href="/analytics"
            icon="📊"
            available={false}
          />
          <QuickAction
            title="WhatsApp Templates"
            description="Manage message templates for customer updates"
            href="/whatsapp"
            icon="💬"
            available={false}
          />
        </div>
      </div>
    </main>
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
  icon,
  available,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  available: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${
        available
          ? "hover:border-green-300 cursor-pointer transition-colors"
          : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-gray-800">{title}</span>
        {!available && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
