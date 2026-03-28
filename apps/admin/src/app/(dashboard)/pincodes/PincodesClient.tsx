"use client";

import { useState, useRef, useEffect } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";

interface Pincode {
  id: string;
  pincode: string;
  area_name: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  delivery_days: number;
  created_at: string;
}

// Helper to make typed queries to the delivery_pincodes table
function getPincodesTable() {
  const supabase = createSupabaseBrowserClient();
  // Cast to bypass generated types since delivery_pincodes isn't in the generated schema yet
  return (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }).from("delivery_pincodes");
}

export default function PincodesClient() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPincodes() {
      try {
        const { data, error } = await getPincodesTable()
          .select("*")
          .order("city")
          .order("pincode");
        if (!error && data) setPincodes(data as unknown as Pincode[]);
      } finally {
        setLoading(false);
      }
    }
    fetchPincodes();
  }, []);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newPincode, setNewPincode] = useState({
    pincode: "",
    area_name: "",
    city: "",
    state: "",
    delivery_days: 3,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = pincodes.filter(
    (p) =>
      p.pincode.includes(search) ||
      (p.area_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!newPincode.pincode || newPincode.pincode.length !== 6) {
      setError("Enter a valid 6-digit pincode");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data, error: insertError } = await getPincodesTable()
        .insert({
          pincode: newPincode.pincode,
          area_name: newPincode.area_name || null,
          city: newPincode.city || null,
          state: newPincode.state || null,
          delivery_days: newPincode.delivery_days,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setPincodes((prev) => [...prev, data as unknown as Pincode]);
        setNewPincode({ pincode: "", area_name: "", city: "", state: "", delivery_days: 3 });
        setShowAdd(false);
        setSuccess("Pincode added successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pincode");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const { error: updateError } = await getPincodesTable()
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (!updateError) {
      setPincodes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentActive } : p))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pincode?")) return;
    const { error: deleteError } = await getPincodesTable()
      .delete()
      .eq("id", id);

    if (!deleteError) {
      setPincodes((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      // Skip header if first line contains non-numeric content
      const firstLine = lines[0] ?? "";
      const startIdx = /^\d{6}/.test(firstLine) ? 0 : 1;
      const parsed: string[] = [];

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i] ?? "";
        const cols = line.split(",").map((c) => c.trim());
        if (cols[0] && /^\d{6}$/.test(cols[0])) {
          parsed.push(line);
        }
      }

      setBulkText(text);
      setBulkPreview(parsed);
      setShowBulk(true);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleBulkInsert() {
    setSaving(true);
    setError("");
    try {
      const rows = bulkPreview.map((line) => {
        const [pincode, area_name, city, state, days] = line.split(",").map((c) => c.trim());
        return {
          pincode,
          area_name: area_name || null,
          city: city || null,
          state: state || null,
          delivery_days: days ? parseInt(days) : 3,
        };
      });

      const { data, error: insertError } = await getPincodesTable()
        .upsert(rows, { onConflict: "pincode" })
        .select();

      if (insertError) throw insertError;
      if (data) {
        const typedData = data as unknown as Pincode[];
        // Merge with existing
        setPincodes((prev) => {
          const map = new Map(prev.map((p) => [p.pincode, p]));
          for (const d of typedData) map.set(d.pincode, d);
          return Array.from(map.values());
        });
        setShowBulk(false);
        setBulkPreview([]);
        setBulkText("");
        setSuccess(`${data.length} pincodes imported successfully`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search pincodes, areas, cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800"
        >
          + Add Pincode
        </button>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
          Upload CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </label>
        <span className="text-sm text-gray-500">
          {filtered.length} of {pincodes.length} pincodes
        </span>
      </div>

      {/* CSV format hint */}
      <p className="text-xs text-gray-400">
        CSV format: <code>pincode,area_name,city,state,delivery_days</code> (one per line)
      </p>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Add New Pincode</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              placeholder="Pincode *"
              value={newPincode.pincode}
              onChange={(e) => setNewPincode((p) => ({ ...p, pincode: e.target.value }))}
              maxLength={6}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Area name"
              value={newPincode.area_name}
              onChange={(e) => setNewPincode((p) => ({ ...p, area_name: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="City"
              value={newPincode.city}
              onChange={(e) => setNewPincode((p) => ({ ...p, city: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="State"
              value={newPincode.state}
              onChange={(e) => setNewPincode((p) => ({ ...p, state: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Days"
              value={newPincode.delivery_days}
              onChange={(e) => setNewPincode((p) => ({ ...p, delivery_days: parseInt(e.target.value) || 3 }))}
              min={1}
              max={14}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Upload Preview */}
      {showBulk && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">
            CSV Preview — {bulkPreview.length} pincodes found
          </h3>
          <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-3 text-xs font-mono">
            {bulkPreview.slice(0, 20).map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
            {bulkPreview.length > 20 && (
              <div className="text-gray-400 mt-1">...and {bulkPreview.length - 20} more</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkInsert}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Importing..." : `Import ${bulkPreview.length} pincodes`}
            </button>
            <button
              onClick={() => { setShowBulk(false); setBulkPreview([]); }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Pincode</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Area</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">City</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">State</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Days</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold">{p.pincode}</td>
                <td className="px-4 py-3 text-gray-600">{p.area_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.city ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.state ?? "—"}</td>
                <td className="px-4 py-3">{p.delivery_days}d</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(p.id, p.is_active)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {p.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No pincodes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
