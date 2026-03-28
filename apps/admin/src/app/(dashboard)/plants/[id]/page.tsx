import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { PlantForm } from "../../../../components/PlantForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) notFound();

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
        <span className="text-gray-800 font-medium">{plant.name}</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Edit: {plant.name}
      </h2>

      <PlantForm
        plant={{
          id: plant.id,
          name: plant.name,
          slug: plant.slug,
          description: plant.description ?? "",
          category_id: plant.category_id,
          price_paise: plant.price_paise,
          compare_at_price_paise: plant.compare_at_price_paise ?? null,
          stock_quantity: plant.stock_quantity,
          image_url: plant.image_url ?? "",
          images: (plant.images as string[]) ?? [],
          care_level: plant.care_level ?? "medium",
          sunlight: plant.sunlight ?? "indirect",
          watering: plant.watering ?? "moderate",
          care_tips: plant.care_tips ?? "",
          is_active: plant.is_active ?? true,
          is_featured: plant.is_featured ?? false,
        }}
        categories={categories ?? []}
      />
    </div>
  );
}
