import Link from "next/link";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { BulkUploadClient } from "./BulkUploadClient";

export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/plants" className="hover:text-green-700">
          Plants
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Bulk Upload</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Upload</h2>
      <p className="text-gray-500 text-sm mb-6">
        Upload plants via CSV or JSON file. Download the template below for the correct format.
      </p>

      <BulkUploadClient categories={categories ?? []} />
    </div>
  );
}
