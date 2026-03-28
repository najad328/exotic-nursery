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
  compare_at_price_paise: number | null;
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
  compare_at_price_paise: null,
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
  const [comparePriceRupees, setComparePriceRupees] = useState(
    plant?.compare_at_price_paise ? (plant.compare_at_price_paise / 100).toString() : ""
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

  function handleComparePriceChange(value: string) {
    setComparePriceRupees(value);
    if (!value.trim()) {
      updateField("compare_at_price_paise", null);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateField("compare_at_price_paise", toPaise(num));
    }
  }

  async function uploadSingleImage(file: File): Promise<string> {
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

    return urlData.publicUrl;
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
      const url = await uploadSingleImage(file);
      updateField("image_url", url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setErrors((prev) => ({ ...prev, image_url: message }));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAdditionalImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 5;
    const currentCount = form.images.length;
    if (currentCount >= maxImages) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${maxImages} additional images allowed` }));
      return;
    }

    setUploadingImage(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    try {
      const filesToUpload = Array.from(files).slice(0, maxImages - currentCount);
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            images: `${file.name} exceeds 5MB limit — skipped`,
          }));
          continue;
        }
        const url = await uploadSingleImage(file);
        uploadedUrls.push(url);
      }

      updateField("images", [...form.images, ...uploadedUrls]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setErrors((prev) => ({ ...prev, images: message }));
    } finally {
      setUploadingImage(false);
    }
  }

  function removeAdditionalImage(index: number) {
    updateField(
      "images",
      form.images.filter((_, i) => i !== index)
    );
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
        compare_at_price_paise: form.compare_at_price_paise || null,
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

          <Field label="Compare at Price (₹)" error={errors.compare_at_price_paise}>
            <input
              type="number"
              value={comparePriceRupees}
              onChange={(e) => handleComparePriceChange(e.target.value)}
              placeholder="499 (leave blank for no discount)"
              step="0.01"
              min="0"
              className="input-field"
            />
            {form.compare_at_price_paise && form.compare_at_price_paise > form.price_paise && (
              <p className="text-xs text-green-600 mt-1">
                💰 {Math.round(((form.compare_at_price_paise - form.price_paise) / form.compare_at_price_paise) * 100)}% off — shows strikethrough price on mobile
              </p>
            )}
            {form.compare_at_price_paise && form.compare_at_price_paise <= form.price_paise && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Compare price must be higher than selling price
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

      {/* Images */}
      <fieldset className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Images
        </legend>

        {/* Primary Image */}
        <Field label="Primary Image (featured)" error={errors.image_url}>
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
            <div className="relative">
              <img
                src={form.image_url}
                alt="Primary"
                className="w-24 h-24 rounded-lg object-cover border-2 border-green-500"
              />
              <span className="absolute -top-2 -left-2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                Primary
              </span>
            </div>
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

        {/* Additional Images */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <Field
            label={`Additional Images (${form.images.length}/5)`}
            error={errors.images}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleAdditionalImageUpload}
              disabled={uploadingImage || form.images.length >= 5}
              className="input-field text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              Upload up to 5 additional images. Max 5MB each. JPEG, PNG, or WebP.
            </p>
          </Field>

          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {form.images.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
