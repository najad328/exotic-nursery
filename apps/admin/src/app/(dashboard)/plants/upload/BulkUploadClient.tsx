"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { validateBulkUpload, generateSlug, toPaise } from "@exotic-nursery/utils";
import type { BulkPlantRow } from "@exotic-nursery/utils";
import { createSupabaseBrowserClient } from "../../../../lib/supabase-browser";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

type UploadState = "idle" | "parsed" | "uploading" | "done" | "error";

const CSV_TEMPLATE = `name,description,category_name,price_rupees,stock_quantity,care_level,sunlight,watering,care_tips,is_featured
"Monstera Thai","A rare variegated Monstera with stunning white patterns.","Rare & Exotic",4500,5,hard,indirect,moderate,"Keep away from direct sunlight. Mist regularly.",true
"Golden Pothos","Easy-care trailing vine perfect for beginners.","Indoor Plants",299,100,easy,low_light,weekly,"Trim regularly to encourage bushy growth.",false`;

const JSON_TEMPLATE = JSON.stringify(
  [
    {
      name: "Monstera Thai",
      description: "A rare variegated Monstera with stunning white patterns.",
      category_name: "Rare & Exotic",
      price_rupees: 4500,
      stock_quantity: 5,
      care_level: "hard",
      sunlight: "indirect",
      watering: "moderate",
      care_tips: "Keep away from direct sunlight. Mist regularly.",
      is_featured: true,
    },
  ],
  null,
  2
);

export function BulkUploadClient({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [validRows, setValidRows] = useState<BulkPlantRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Array<{ row: number; errors: string[] }>>([]);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; failed: number }>({ inserted: 0, failed: 0 });
  const [globalError, setGlobalError] = useState("");

  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  );

  const parseFile = useCallback(
    (file: File) => {
      setGlobalError("");
      setRowErrors([]);
      setValidRows([]);

      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete(results) {
            processRows(results.data as Record<string, unknown>[]);
          },
          error(err) {
            setGlobalError(`CSV parse error: ${err.message}`);
            setState("error");
          },
        });
      } else if (ext === "json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (!Array.isArray(data)) {
              setGlobalError("JSON file must contain an array of plant objects.");
              setState("error");
              return;
            }
            processRows(data);
          } catch {
            setGlobalError("Invalid JSON file.");
            setState("error");
          }
        };
        reader.readAsText(file);
      } else {
        setGlobalError("Unsupported file format. Use .csv or .json.");
        setState("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories]
  );

  function processRows(rows: Record<string, unknown>[]) {
    const { valid, errors } = validateBulkUpload(rows);

    // Check category names resolve
    const resolvedErrors: Array<{ row: number; errors: string[] }> = [...errors];
    for (const [i, row] of valid.entries()) {
      const catId = categoryMap.get(row.category_name.toLowerCase());
      if (!catId) {
        resolvedErrors.push({
          row: i + 1,
          errors: [`category_name: "${row.category_name}" not found. Available: ${categories.map((c) => c.name).join(", ")}`],
        });
      }
    }

    setValidRows(valid.filter((r) => categoryMap.has(r.category_name.toLowerCase())));
    setRowErrors(resolvedErrors.sort((a, b) => a.row - b.row));
    setState("parsed");
  }

  async function handleUpload() {
    setState("uploading");
    let inserted = 0;
    let failed = 0;

    const supabase = createSupabaseBrowserClient();
    const BATCH_SIZE = 50;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map((row) => ({
        name: row.name,
        slug: generateSlug(row.name),
        description: row.description,
        category_id: categoryMap.get(row.category_name.toLowerCase())!,
        price_paise: toPaise(row.price_rupees as number),
        stock_quantity: row.stock_quantity as number,
        care_level: row.care_level,
        sunlight: row.sunlight,
        watering: row.watering,
        care_tips: row.care_tips,
        is_featured: row.is_featured as boolean,
        is_active: true,
      }));

      const { error, data } = await supabase
        .from("plants")
        .insert(batch)
        .select("id");

      if (error) {
        failed += batch.length;
        setRowErrors((prev) => [
          ...prev,
          { row: i + 1, errors: [`Batch insert error: ${error.message}`] },
        ]);
      } else {
        inserted += data?.length ?? 0;
      }
    }

    setUploadResult({ inserted, failed });
    setState("done");
    router.refresh();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  function downloadTemplate(format: "csv" | "json") {
    const content = format === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE;
    const mime = format === "csv" ? "text/csv" : "application/json";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plants-template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Download Template</h3>
        <p className="text-sm text-gray-500 mb-4">
          Use these templates to format your plant data correctly.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => downloadTemplate("csv")}
            className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            📄 Download CSV Template
          </button>
          <button
            onClick={() => downloadTemplate("json")}
            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            📋 Download JSON Template
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Upload File</h3>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          className="input-field text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer"
        />
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {globalError}
        </div>
      )}

      {/* Validation Errors */}
      {rowErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2">
            ⚠️ {rowErrors.length} row(s) with errors (will be skipped)
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {rowErrors.map((re) => (
              <div key={re.row} className="text-sm text-amber-700">
                <span className="font-mono font-medium">Row {re.row}:</span>{" "}
                {re.errors.join("; ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {state === "parsed" && validRows.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              ✅ {validRows.length} valid plant(s) ready to upload
            </p>
            <button
              onClick={handleUpload}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Upload {validRows.length} Plants
            </button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Price (₹)</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-center">Care</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {validRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600">{row.category_name}</td>
                    <td className="px-3 py-2 text-right font-mono">₹{row.price_rupees}</td>
                    <td className="px-3 py-2 text-right">{row.stock_quantity}</td>
                    <td className="px-3 py-2 text-center capitalize">{row.care_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Uploading */}
      {state === "uploading" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Uploading plants... please wait.
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-1">Upload Complete</h3>
          <p className="text-sm text-green-700">
            ✅ {uploadResult.inserted} plant(s) inserted successfully.
            {uploadResult.failed > 0 && (
              <span className="text-red-600 ml-2">
                ❌ {uploadResult.failed} failed.
              </span>
            )}
          </p>
          <button
            onClick={() => router.push("/plants")}
            className="mt-3 text-green-700 hover:underline text-sm font-medium"
          >
            ← Back to Plants
          </button>
        </div>
      )}

      {/* Format Reference */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Column Reference</h3>
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pr-4 py-1">Column</th>
                <th className="pr-4 py-1">Required</th>
                <th className="py-1">Values</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr><td className="pr-4 py-1 font-mono">name</td><td className="pr-4">Yes</td><td>2-100 chars</td></tr>
              <tr><td className="pr-4 py-1 font-mono">description</td><td className="pr-4">Yes</td><td>10-2000 chars</td></tr>
              <tr><td className="pr-4 py-1 font-mono">category_name</td><td className="pr-4">Yes</td><td>Must match: {categories.map((c) => c.name).join(", ")}</td></tr>
              <tr><td className="pr-4 py-1 font-mono">price_rupees</td><td className="pr-4">Yes</td><td>1 - 100000</td></tr>
              <tr><td className="pr-4 py-1 font-mono">stock_quantity</td><td className="pr-4">Yes</td><td>0 - 99999</td></tr>
              <tr><td className="pr-4 py-1 font-mono">care_level</td><td className="pr-4">No</td><td>easy, medium, hard, expert</td></tr>
              <tr><td className="pr-4 py-1 font-mono">sunlight</td><td className="pr-4">No</td><td>full_sun, partial, indirect, low_light</td></tr>
              <tr><td className="pr-4 py-1 font-mono">watering</td><td className="pr-4">No</td><td>daily, moderate, weekly, minimal</td></tr>
              <tr><td className="pr-4 py-1 font-mono">care_tips</td><td className="pr-4">No</td><td>Free text</td></tr>
              <tr><td className="pr-4 py-1 font-mono">is_featured</td><td className="pr-4">No</td><td>true/false</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
