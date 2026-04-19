import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  configureForegroundHandler,
  initializePushNotifications,
} from "../services/notifications";

// Suppress native module errors for expo-notifications/expo-device
// These modules require a native rebuild ΓÇö harmless until then
LogBox.ignoreLogs([
  "Cannot find native module",
  "expo-notifications",
  "expo-device",
  "ExpoPushTokenManager",
  "ExpoDevice",
]);

// Configure foreground notification display (no-op if native module missing)
configureForegroundHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const notificationListener = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseListener = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store cleanup functions for notification listeners
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile();
        // Register push notifications after auth
        initializePushNotifications(session.user.id).catch(console.error);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile();
        initializePushNotifications(session.user.id).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, fetchProfile]);

  // Handle notification taps ΓÇö navigate to relevant screen
  useEffect(() => {
    // Wrap in try-catch: native module may not be available in current APK
    try {
      const Notifications = require("expo-notifications") as typeof import("expo-notifications");

      // Listener for when notification is received while app is foregrounded
      const notifSub = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log("[Notifications] Received:", notification.request.content.title);
        }
      );

      // Listener for when user taps a notification
      const responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;

          if (data?.type === "order_status" && data?.orderId) {
            router.push(`/order/${data.orderId}`);
          } else if (data?.type === "new_arrival" && data?.plantSlug) {
            router.push(`/plant/${data.plantSlug}`);
          } else if (data?.type === "price_drop" && data?.plantSlug) {
            router.push(`/plant/${data.plantSlug}`);
          }
        }
      );

      cleanupRef.current = [
        () => notifSub.remove(),
        () => responseSub.remove(),
      ];
    } catch {
      console.warn("[Notifications] Native module not available ΓÇö skipping listeners");
    }

    return () => {
      for (const cleanup of cleanupRef.current) {
        cleanup();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1B5E20" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#F5F5F5" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="plant/[slug]"
          options={{ title: "Plant Details" }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: "Checkout" }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ title: "Order Details" }}
        />
      </Stack>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
