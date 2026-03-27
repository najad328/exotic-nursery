import { supabase } from "./supabase";
import type { PlantFilters } from "@exotic-nursery/types";

const PAGE_SIZE = 20;

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getPlants(filters: PlantFilters = {}) {
  const {
    search,
    category_slug,
    care_level,
    min_price_paise,
    max_price_paise,
    is_featured,
    sort_by = "newest",
    page = 1,
    limit = PAGE_SIZE,
  } = filters;

  let query = supabase
    .from("plants")
    .select("*, category:categories!inner(id, name, slug)", { count: "exact" })
    .eq("is_active", true);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (category_slug) {
    query = query.eq("category.slug", category_slug);
  }

  if (care_level) {
    query = query.eq("care_level", care_level);
  }

  if (min_price_paise !== undefined) {
    query = query.gte("price_paise", min_price_paise);
  }

  if (max_price_paise !== undefined) {
    query = query.lte("price_paise", max_price_paise);
  }

  if (is_featured !== undefined) {
    query = query.eq("is_featured", is_featured);
  }

  // Sorting
  switch (sort_by) {
    case "name":
      query = query.order("name");
      break;
    case "price_low":
      query = query.order("price_paise", { ascending: true });
      break;
    case "price_high":
      query = query.order("price_paise", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return { plants: data, total: count ?? 0 };
}

export async function getPlantBySlug(slug: string) {
  const { data, error } = await supabase
    .from("plants")
    .select("*, category:categories!inner(id, name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data;
}

export async function getFeaturedPlants() {
  const { data, error } = await supabase
    .from("plants")
    .select("*, category:categories!inner(id, name, slug)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(8);

  if (error) throw error;
  return data;
}
