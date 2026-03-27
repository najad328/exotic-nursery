"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { interpolateTemplate, buildWhatsAppUrl } from "@exotic-nursery/utils";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";

interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  message: string;
  variables: string[];
  is_active: boolean;
  sort_order: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  order_status: "bg-blue-100 text-blue-700",
  inquiry: "bg-purple-100 text-purple-700",
  promotion: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

export function WhatsAppTemplatesClient({
  templates,
}: {
  templates: Template[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = templates.find((t) => t.id === selectedId);

  function handleSelect(template: Template) {
    setSelectedId(template.id);
    setCopied(false);
    // Pre-fill variable values with placeholders
    const defaults: Record<string, string> = {};
    for (const v of template.variables) {
      defaults[v] = variableValues[v] ?? "";
    }
    setVariableValues(defaults);
  }

  function getPreviewMessage(): string {
    if (!selected) return "";
    return interpolateTemplate(selected.message, variableValues);
  }

  async function handleCopy() {
    const msg = getPreviewMessage();
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = msg;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleOpenWhatsApp() {
    if (!phone.trim()) return;
    const msg = getPreviewMessage();
    const url = buildWhatsAppUrl(phone, msg);
    window.open(url, "_blank");
  }

  async function handleSaveEdit() {
    if (!editing || !editMessage.trim()) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("whatsapp_templates")
        .update({ message: editMessage })
        .eq("id", editing);
      if (error) throw error;
      setEditing(null);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Templates ({templates.length})
        </h3>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelect(template)}
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
              selectedId === template.id
                ? "border-green-500 ring-2 ring-green-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{template.name}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general
                }`}
              >
                {template.category.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {template.message}
            </p>
            {template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.variables.map((v) => (
                  <span
                    key={v}
                    className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview & Send Panel */}
      <div>
        {selected ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">
              {selected.name}
            </h3>

            {/* Variable Inputs */}
            {selected.variables.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-gray-600">
                  Fill in variables:
                </p>
                {selected.variables.map((v) => (
                  <div key={v}>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {v.replace(/_/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={variableValues[v] ?? ""}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [v]: e.target.value,
                        }))
                      }
                      placeholder={v}
                      className="input-field text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
              <div className="bg-green-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed border border-green-100">
                {editing === selected.id ? (
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-white border rounded-lg p-2 text-sm resize-y"
                  />
                ) : (
                  getPreviewMessage()
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {copied ? "✅ Copied!" : "📋 Copy Message"}
              </button>

              {/* Send via WhatsApp */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Customer phone (10 digits)"
                  className="input-field text-sm flex-1"
                  maxLength={10}
                />
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={phone.trim().length < 10}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  💬 Send
                </button>
              </div>

              {/* Edit Template */}
              {editing === selected.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(selected.id);
                    setEditMessage(selected.message);
                  }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  ✏️ Edit Template
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500">
              Select a template to preview and send
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
