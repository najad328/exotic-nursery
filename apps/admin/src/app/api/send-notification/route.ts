/**
 * POST /api/send-notification
 *
 * Sends push notifications to users via the Expo Push API.
 * Supports: order_status, new_arrival, price_drop, promotion, custom, broadcast.
 *
 * Body shape:
 * {
 *   type: NotificationType;
 *   title: string;
 *   body: string;
 *   data?: Record<string, unknown>;
 *   channelId?: string;
 *   // Target — pick one:
 *   userId?: string;       // single user
 *   broadcast?: boolean;   // all active tokens
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../lib/supabase-service";
import {
  sendPushNotifications,
  buildNotificationPayload,
} from "@exotic-nursery/utils";
import type { NotificationType } from "@exotic-nursery/types";

interface SendNotificationBody {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  userId?: string;
  orderId?: string;
  plantId?: string;
  broadcast?: boolean;
}

// Type helpers for tables not yet in generated types (push_tokens, notification_log)
interface TokenRow {
  token: string;
}

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendNotificationBody;
    const { type, title, body: notifBody, data, channelId, userId, orderId, plantId, broadcast } = body;

    if (!type || !title || !notifBody) {
      return NextResponse.json(
        { error: "type, title, and body are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Fetch target tokens
    // push_tokens table added via migration — cast to bypass generated types until regenerated
    let tokens: string[] = [];

    if (broadcast) {
      const result = await (supabase
        .from("push_tokens" as "profiles")
        .select("token")
        .eq("is_active" as "id", true as unknown as string)) as unknown as QueryResult<TokenRow>;

      if (result.error) throw new Error(result.error.message);
      tokens = (result.data ?? []).map((r) => r.token);
    } else if (userId) {
      const result = await (supabase
        .from("push_tokens" as "profiles")
        .select("token")
        .eq("user_id" as "id", userId)
        .eq("is_active" as "id", true as unknown as string)) as unknown as QueryResult<TokenRow>;

      if (result.error) throw new Error(result.error.message);
      tokens = (result.data ?? []).map((r) => r.token);
    } else {
      return NextResponse.json(
        { error: "Either userId or broadcast must be specified" },
        { status: 400 }
      );
    }

    if (tokens.length === 0) {
      await logNotification(supabase, {
        type,
        title,
        body: notifBody,
        data: data ?? null,
        userId: broadcast ? null : userId ?? null,
        orderId: orderId ?? null,
        plantId: plantId ?? null,
        isBroadcast: broadcast ?? false,
        status: "sent",
        recipientCount: 0,
      });

      return NextResponse.json({
        success: true,
        message: "No active push tokens found",
        sent: 0,
        failed: 0,
      });
    }

    // Build and send notification
    const payload = buildNotificationPayload(tokens, title, notifBody, {
      ...data,
      type,
    });
    if (channelId) {
      payload.channelId = channelId;
    }

    const sendResult = await sendPushNotifications([payload]);

    // Clean up invalid tokens
    if (sendResult.invalidTokens.length > 0) {
      await (supabase
        .from("push_tokens" as "profiles")
        .update({ is_active: false } as Record<string, unknown> as { id: string })
        .in("token" as "id", sendResult.invalidTokens));
    }

    // Log the notification
    await logNotification(supabase, {
      type,
      title,
      body: notifBody,
      data: data ?? null,
      userId: broadcast ? null : userId ?? null,
      orderId: orderId ?? null,
      plantId: plantId ?? null,
      isBroadcast: broadcast ?? false,
      status: sendResult.failures > 0 && sendResult.successes === 0 ? "failed" : "sent",
      recipientCount: sendResult.successes,
    });

    return NextResponse.json({
      success: true,
      sent: sendResult.successes,
      failed: sendResult.failures,
      invalidTokensCleaned: sendResult.invalidTokens.length,
    });
  } catch (err) {
    console.error("[send-notification] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper: log notification to notification_log table
async function logNotification(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  entry: {
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    userId: string | null;
    orderId: string | null;
    plantId: string | null;
    isBroadcast: boolean;
    status: "sent" | "failed";
    recipientCount: number;
  }
) {
  // notification_log table added via migration — cast to bypass generated types
  const { error } = await (supabase.from("notification_log" as "orders") as unknown as {
    insert: (data: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  }).insert({
    type: entry.type,
    title: entry.title,
    body: entry.body,
    data: entry.data,
    user_id: entry.userId,
    order_id: entry.orderId,
    plant_id: entry.plantId,
    is_broadcast: entry.isBroadcast,
    status: entry.status,
    recipient_count: entry.recipientCount,
  });

  if (error) {
    console.error("[send-notification] Failed to log notification:", error.message);
  }
}
