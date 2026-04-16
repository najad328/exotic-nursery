"use client";

import { useState } from "react";
import type { NotificationLog } from "./page";

type NotificationType =
  | "order_status"
  | "new_arrival"
  | "price_drop"
  | "promotion"
  | "custom";

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "promotion", label: "Promotion" },
  { value: "new_arrival", label: "New Arrival" },
  { value: "price_drop", label: "Price Drop" },
  { value: "custom", label: "Custom Message" },
];

const TYPE_BADGES: Record<string, string> = {
  order_status: "bg-blue-100 text-blue-800",
  new_arrival: "bg-green-100 text-green-800",
  price_drop: "bg-orange-100 text-orange-800",
  promotion: "bg-purple-100 text-purple-800",
  custom: "bg-gray-100 text-gray-800",
};

export function NotificationsClient({
  initialLogs,
}: {
  initialLogs: NotificationLog[];
}) {
  const [type, setType] = useState<NotificationType>("promotion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [logs, setLogs] = useState(initialLogs);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setResult("Error: Title and body are required");
      return;
    }

    setSending(true);
    setResult("");

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim(),
          broadcast: true,
          channelId: type === "order_status" ? "orders" : "promotions",
          data: { type },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(`Error: ${data.error}`);
        return;
      }

      setResult(
        `Sent to ${data.sent} device${data.sent !== 1 ? "s" : ""}${
          data.failed > 0 ? `, ${data.failed} failed` : ""
        }${data.invalidTokensCleaned > 0 ? `, ${data.invalidTokensCleaned} stale tokens cleaned` : ""}`
      );

      // Add to log locally
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          type,
          title: title.trim(),
          body: body.trim(),
          user_id: null,
          order_id: null,
          plant_id: null,
          is_broadcast: true,
          status: "sent",
          recipient_count: data.sent,
          sent_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Clear form
      setTitle("");
      setBody("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      setResult(`Error: ${msg}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Send Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Send Broadcast Notification
        </h2>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="input-field w-full"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Sale! 20% off all Monsteras"
              className="input-field w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the notification message..."
              rows={3}
              className="input-field w-full resize-y"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              {body.length}/500 characters
            </p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  EN
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {title || "Notification Title"}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {body || "Notification body text..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {sending ? "Sending..." : "Send to All Users"}
            </button>

            {result && (
              <p
                className={`text-sm ${
                  result.startsWith("Error")
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {result}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Notification History
        </h2>

        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            No notifications sent yet. Send your first one above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Title
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Body
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Target
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Sent
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_BADGES[log.type] ?? TYPE_BADGES.custom
                        }`}
                      >
                        {log.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-800 max-w-[200px] truncate">
                      {log.title}
                    </td>
                    <td className="py-3 px-2 text-gray-600 max-w-[250px] truncate">
                      {log.body}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {log.is_broadcast ? (
                        <span className="text-purple-600 font-medium">
                          Broadcast
                        </span>
                      ) : (
                        <span className="font-mono text-xs">
                          {log.user_id?.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-800 font-medium">
                      {log.recipient_count}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                      {new Date(log.sent_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
