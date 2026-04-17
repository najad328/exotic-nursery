import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getOrders } from "../../services/orders";
import { formatPrice } from "@exotic-nursery/utils";
import { ORDER_STATUS_LABELS } from "@exotic-nursery/types";
import type { Order, OrderStatus } from "@exotic-nursery/types";
import { colors, radius, shadows, spacing } from "../../theme";
import { SkeletonOrderCard } from "../../components/Skeleton";

type StatusStyle = {
  bg: string;
  text: string;
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  active: { bg: colors.successContainer, text: colors.success },
  confirmed: { bg: colors.successContainer, text: colors.success },
  delivered: { bg: colors.successContainer, text: colors.success },
  processing: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  pending: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  shipped: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  cancelled: { bg: colors.errorContainer, text: colors.error },
  returned: { bg: colors.errorContainer, text: colors.error },
};

function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? {
    bg: colors.surfaceContainer,
    text: colors.onSurfaceVariant,
  };
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [])
  );

  async function loadOrders() {
    try {
      setLoading(true);
      setError(false);
      const data = await getOrders();
      setOrders(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Loading state — skeleton cards
  if (loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonOrderCard key={i} />
        ))}
      </ScrollView>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Couldn't load orders</Text>
        <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadOrders()} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={colors.textTertiary}
          />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Your order history will appear here
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.push("/(tabs)/search")}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Browse Plants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.orderIdRow}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={colors.onSurfaceVariant}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.orderId}>
                  #{item.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.bg },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: statusStyle.text }]}
                >
                  {ORDER_STATUS_LABELS[item.status as OrderStatus] ??
                    item.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textTertiary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text style={styles.total}>{formatPrice(item.total_paise)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <Ionicons
                name={
                  item.payment_method === "cod"
                    ? "cash-outline"
                    : "phone-portrait-outline"
                }
                size={14}
                color={colors.textTertiary}
                style={{ marginRight: spacing.xs }}
              />
              <Text style={styles.paymentMethod}>
                {item.payment_method === "cod"
                  ? "Cash on Delivery"
                  : "UPI Payment"}
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons
                name="chevron-forward-outline"
                size={16}
                color={colors.outline}
              />
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.sm,
  },

  // Empty / error state
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onBackground,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
