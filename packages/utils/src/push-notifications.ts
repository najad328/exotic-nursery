/**
 * Push Notification utilities — sends notifications via Expo Push API.
 * Works from any server environment (Next.js API routes, Edge Functions, etc.)
 * No React Native dependencies — just fetch().
 */

import type { NotificationPayload } from "@exotic-nursery/types";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100; // Expo API max per request

/**
 * Send push notifications via the Expo Push API.
 * Automatically chunks large batches (max 100 per request).
 *
 * @returns counts of successes and failures
 */
export async function sendPushNotifications(
  messages: NotificationPayload[]
): Promise<{ successes: number; failures: number; invalidTokens: string[] }> {
  if (messages.length === 0) {
    return { successes: 0, failures: 0, invalidTokens: [] };
  }

  let successes = 0;
  let failures = 0;
  const invalidTokens: string[] = [];

  // Flatten: if `to` is an array, expand into individual messages
  const expanded: Array<Omit<NotificationPayload, "to"> & { to: string }> = [];
  for (const msg of messages) {
    const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
    for (const token of tokens) {
      expanded.push({
        ...msg,
        to: token,
        sound: msg.sound ?? "default",
        channelId: msg.channelId ?? "orders",
      });
    }
  }

  // Chunk into batches of CHUNK_SIZE
  for (let i = 0; i < expanded.length; i += CHUNK_SIZE) {
    const chunk = expanded.slice(i, i + CHUNK_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        failures += chunk.length;
        continue;
      }

      const result = (await response.json()) as {
        data: Array<{
          status: "ok" | "error";
          details?: { error?: string };
          message?: string;
        }>;
      };
      const tickets = result.data as Array<{
        status: "ok" | "error";
        details?: { error?: string };
        message?: string;
      }>;

      for (let j = 0; j < tickets.length; j++) {
        const ticket = tickets[j];
        if (ticket?.status === "ok") {
          successes++;
        } else {
          failures++;
          // Track invalid tokens for cleanup
          if (ticket?.details?.error === "DeviceNotRegistered") {
            invalidTokens.push(chunk[j]!.to);
          }
        }
      }
    } catch {
      failures += chunk.length;
    }
  }

  return { successes, failures, invalidTokens };
}

/**
 * Build a single NotificationPayload from tokens + content.
 * Convenience wrapper for the common case.
 */
export function buildNotificationPayload(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): NotificationPayload {
  return {
    to: tokens,
    title,
    body,
    data: data ?? {},
    sound: "default",
    channelId: "orders",
  };
}
