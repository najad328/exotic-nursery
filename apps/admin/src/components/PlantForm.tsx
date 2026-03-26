"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPlantSchema, generateSlug, toPaise, formatPrice } from "@exotic-nursery/utils";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

interface CategoryOption {
  id: string;
  name: string;
}

interface PlantData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  price_paise: number;
  stock_quantity: number;
  image_url: string;
  images: string[];
  care_level: string;
  sunlight: string;
  watering: string;
  care_tips: string;
  is_active: boolean;
  is_featured: boolean;
}

const EMPTY_PLANT: PlantData = {
  name: "",
  slug: "",
  description: "",
  category_id: "",
  price_paise: 0,
  stock_quantity: 0,
  image_url: "",
  images: [],
  care_level: "medium",
  sunlight: "indirect",
  watering: "moderate",
  care_tips: "",
  is_active: true,
  is_featured: false,
};

export function PlantForm({
  plant,
  categories,
}: {
  plant?: PlantData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const isEditing = !!plant?.id;
  const [form, setForm] = useState<PlantData>(plant ?? EMPTY_PLANT);
  const [priceRupees, setPriceRupees] = useState(
    plant ? (plant.price_paise / 100).toString() : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = useCallback(
    <K extends keyof PlantData>(key: K, value: PlantData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  function handleNameChange(name: string) {
    updateField("name", name);
    if (!isEditing || !form.slug) {
      updateField("slug", generateSlug(name));
    }
  }

  function handlePriceChange(value: string) {
    setPriceRupees(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateField("price_paise", toPaise(num));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image_url: "Image must be under 5MB" }));
      return;
    }

    setUploadingImage(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `plants/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("plant-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("plant-images")
        .getPublicUrl(filePath);

      updateField("image_url", urlData.publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setErrors((prev) => ({ ...prev, image_url: message }));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // Validate with Zod
    const result = createPlantSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of result.error.errors) {
        const key = err.path.join(".");
        if (!fieldErrors[key]) {
          fieldErrors[key] = err.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const payload = {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description,
        category_id: result.data.category_id,
        price_paise: result.data.price_paise,
        stock_quantity: result.data.stock_quantity,
        image_url: result.data.image_url || null,
        images: result.data.images,
        care_level: result.data.care_level,
        sunlight: result.data.sunlight,
        watering: result.data.watering,
        care_tips: result.data.care_tips,
        is_active: result.data.is_active,
        is_featured: result.data.is_featured,
      };

      if (isEditing && plant?.id) {
        const { error } = await supabase
          .from("plants")
          .update(payload)
          .eq("id", plant.id);
        if (error) throw error;
        setSuccessMessage("Plant updated successfully!");
      } else {
        const { error } = await supabase.from("plants").insert(payload);
        if (error) throw error;
        setSuccessMessage("Plant created successfully!");
        router.push("/plants");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setErrors({ _form: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!plant?.id) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("plants")
        .update({ is_active: !form.is_active })
        .eq("id", plant.id);
      if (error) throw error;
      updateField("is_active", !form.is_active);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setErrors({ _form: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {errors._form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors._form}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Basic Info */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Basic Information
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Plant Name" error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Monstera Deliciosa"
              className="input-field"
            />
          </Field>

          <Field label="Slug" error={errors.slug} required>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="monstera-deliciosa"
              className="input-field font-mono text-sm"
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description} required>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            placeholder="Describe this plant..."
            className="input-field resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Category" error={errors.category_id} required>
            <select
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
              className="input-field"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Price (₹)" error={errors.price_paise} required>
            <input
              type="number"
              value={priceRupees}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="349"
              step="0.01"
              min="1"
              className="input-field"
            />
            {form.price_paise > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Stored as: {formatPrice(form.price_paise)} ({form.price_paise} paise)
              </p>
            )}
          </Field>

          <Field label="Stock Quantity" error={errors.stock_quantity} required>
            <input
              type="number"
              value={form.stock_quantity || ""}
              onChange={(e) =>
                updateField("stock_quantity", parseInt(e.target.value) || 0)
              }
              placeholder="50"
              min="0"
              className="input-field"
            />
          </Field>
        </div>
      </fieldset>

      {/* Image */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Image
        </legend>

        <Field label="Upload Image" error={errors.image_url}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="input-field text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer"
          />
          {uploadingImage && (
            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
          )}
        </Field>

        {form.image_url && (
          <div className="flex items-center gap-4">
            <img
              src={form.image_url}
              alt="Preview"
              className="w-24 h-24 rounded-lg object-cover border"
            />
            <button
              type="button"
              onClick={() => updateField("image_url", "")}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        <Field label="Or paste image URL">
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
            placeholder="https://..."
            className="input-field text-sm"
          />
        </Field>
      </fieldset>

      {/* Care Info */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Plant Care
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Care Level" error={errors.care_level}>
            <select
              value={form.care_level}
              onChange={(e) => updateField("care_level", e.target.value)}
              className="input-field"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </Field>

          <Field label="Sunlight" error={errors.sunlight}>
            <select
              value={form.sunlight}
              onChange={(e) => updateField("sunlight", e.target.value)}
              className="input-field"
            >
              <option value="full_sun">Full Sun</option>
              <option value="partial">Partial</option>
              <option value="indirect">Indirect</option>
              <option value="low_light">Low Light</option>
            </select>
          </Field>

          <Field label="Watering" error={errors.watering}>
            <select
              value={form.watering}
              onChange={(e) => updateField("watering", e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="moderate">Moderate</option>
              <option value="weekly">Weekly</option>
              <option value="minimal">Minimal</option>
            </select>
          </Field>
        </div>

        <Field label="Care Tips" error={errors.care_tips}>
          <textarea
            value={form.care_tips}
            onChange={(e) => updateField("care_tips", e.target.value)}
            rows={3}
            placeholder="Tips for caring for this plant..."
            className="input-field resize-y"
          />
        </Field>
      </fieldset>

      {/* Flags */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Visibility
        </legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700">Active (visible in catalog)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => updateField("is_featured", e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700">Featured (show on home screen)</span>
          </label>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Update Plant" : "Create Plant"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/plants")}
          className="text-gray-600 hover:text-gray-800 px-4 py-2.5 text-sm"
        >
          Cancel
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={saving}
            className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              form.is_active
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {form.is_active ? "Deactivate" : "Reactivate"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
