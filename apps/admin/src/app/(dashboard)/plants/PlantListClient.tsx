"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@exotic-nursery/utils";

interface PlantRow {
  id: string;
  name: string;
  slug: string;
  price_paise: number;
  stock_quantity: number;
  care_level: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  category_id: string;
  categories: { name: string } | null;
  created_at: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function PlantListClient({
  initialPlants,
  categories,
}: {
  initialPlants: PlantRow[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = initialPlants.filter((plant) => {
    const matchesSearch =
      search === "" ||
      plant.name.toLowerCase().includes(search.toLowerCase()) ||
      plant.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || plant.category_id === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && plant.is_active) ||
      (statusFilter === "inactive" && !plant.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search plants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">
        Showing {filtered.length} of {initialPlants.length} plants
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Plant</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">Care</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No plants found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((plant) => (
                  <tr key={plant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {plant.image_url ? (
                          <img
                            src={plant.image_url}
                            alt={plant.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">
                            🌱
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{plant.name}</p>
                          {plant.is_featured && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {plant.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800">
                      {formatPrice(plant.price_paise)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          plant.stock_quantity <= 5
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }
                      >
                        {plant.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="capitalize text-gray-600">
                        {plant.care_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          plant.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {plant.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/plants/${plant.id}`}
                        className="text-green-700 hover:text-green-800 font-medium hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
