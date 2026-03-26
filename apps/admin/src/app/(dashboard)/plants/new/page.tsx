import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { PlantForm } from "../../../../components/PlantForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/plants" className="hover:text-green-700">
          Plants
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">New Plant</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Plant</h2>

      <PlantForm categories={categories ?? []} />
    </div>
  );
}
