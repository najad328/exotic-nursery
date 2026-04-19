/**
 * Push Notification service for Exotic Nursery mobile app.
 * Handles permission requests, token registration, and notification channels.
 *
 * Uses lazy require() for expo-notifications so the app doesn't crash
 * if the native module isn't available (e.g. debug APK built before adding the plugin).
 */

import { Platform } from "react-native";
import { supabase } from "./supabase";

const EAS_PROJECT_ID = "c48bb285-209e-49e4-8360-db478fd99ac6";

/** Lazy-load expo-notifications ΓÇö returns null if native module is missing */
function getNotificationsModule(): typeof import("expo-notifications") | null {
  try {
    return require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    console.warn("[Notifications] expo-notifications native module not available");
    return null;
  }
}

/** Lazy-load expo-device ΓÇö returns null if native module is missing */
function getDeviceModule(): typeof import("expo-device") | null {
  try {
    return require("expo-device") as typeof import("expo-device");
  } catch {
    console.warn("[Notifications] expo-device native module not available");
    return null;
  }
}

/**
 * Set up Android notification channels.
 * Must be called early (before any notifications arrive).
 */
export function setupNotificationChannels(): void {
  if (Platform.OS !== "android") return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationChannelAsync("orders", {
    name: "Order Updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1B5E20",
    sound: "default",
  });

  Notifications.setNotificationChannelAsync("promotions", {
    name: "Promotions & New Arrivals",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

/**
 * Configure how notifications behave when the app is in the foreground.
 */
export function configureForegroundHandler(): void {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permission and register the Expo push token.
 * Returns the token string, or null if permission denied / not a physical device.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  const Device = getDeviceModule();

  // Push tokens only work on physical devices
  if (Device && !Device.isDevice) {
    console.log("[Notifications] Skipping ΓÇö not a physical device");
    return null;
  }

  // Check existing permission
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifications] Permission not granted");
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  const token = tokenData.data;
  console.log("[Notifications] Token:", token);

  return token;
}

/**
 * Save/update the push token in the database.
 * Uses upsert to handle re-registrations gracefully.
 */
export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  // push_tokens table added via migration ΓÇö cast to bypass generated types until regenerated
  const { error } = await (supabase.from("push_tokens" as "profiles") as unknown as {
    upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  }).upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS as "ios" | "android" | "web",
      device_name: getDeviceModule()?.modelName ?? getDeviceModule()?.deviceName ?? "Unknown",
      is_active: true,
    },
    { onConflict: "user_id,token" }
  );

  if (error) {
    console.error("[Notifications] Failed to save token:", error.message);
  }
}

/**
 * Deactivate push tokens for a user (call on sign-out).
 */
export async function deactivatePushTokens(userId: string): Promise<void> {
  // push_tokens table added via migration ΓÇö cast to bypass generated types until regenerated
  const { error } = await (supabase.from("push_tokens" as "profiles") as unknown as {
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  }).update({ is_active: false }).eq("user_id", userId);

  if (error) {
    console.error(
      "[Notifications] Failed to deactivate tokens:",
      error.message
    );
  }
}

/**
 * Full registration flow: setup channels ΓåÆ request permission ΓåÆ save token.
 * Safe to call multiple times (idempotent).
 * Gracefully handles missing native module (e.g. debug APK built before adding plugin).
 */
export async function initializePushNotifications(
  userId: string
): Promise<void> {
  try {
    setupNotificationChannels();

    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(userId, token);
    }
  } catch (err) {
    console.warn("[Notifications] Push notifications disabled until next native build:", err);
  }
}
