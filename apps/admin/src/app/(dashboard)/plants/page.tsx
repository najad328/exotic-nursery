import { createSupabaseServerClient } from "../../../lib/supabase-server";
import Link from "next/link";
import { PlantListClient } from "./PlantListClient";

export const dynamic = "force-dynamic";

export default async function PlantsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: plants, error } = await supabase
    .from("plants")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load plants: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Plants</h2>
          <p className="text-gray-500 text-sm mt-1">
            {plants?.length ?? 0} plants in catalog
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/plants/upload"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            📤 Bulk Upload
          </Link>
          <Link
            href="/plants/new"
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
          >
            + Add Plant
          </Link>
        </div>
      </div>

      <PlantListClient
        initialPlants={plants ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
