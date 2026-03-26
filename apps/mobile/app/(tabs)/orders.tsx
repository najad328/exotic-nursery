import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getOrders } from "../../services/orders";
import { formatPrice } from "@exotic-nursery/utils";
import { ORDER_STATUS_LABELS } from "@exotic-nursery/types";
import type { Order, OrderStatus } from "@exotic-nursery/types";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch {
      // silently fail — empty list
    } finally {
      setLoading(false);
    }
  }

  if (loading && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Your order history will appear here
        </Text>
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
        const isCancelled = item.status === "cancelled";
        return (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>
                #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isCancelled && styles.statusCancelled,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isCancelled && styles.statusCancelledText,
                  ]}
                >
                  {ORDER_STATUS_LABELS[item.status as OrderStatus] ?? item.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <Text style={styles.total}>{formatPrice(item.total_paise)}</Text>
            </View>
            <Text style={styles.paymentMethod}>
              {item.payment_method === "cod" ? "💰 Cash on Delivery" : "📱 UPI"}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  list: { padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  emptySubtitle: { fontSize: 14, color: "#888", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: { fontSize: 15, fontWeight: "bold", color: "#333" },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusCancelled: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 11, fontWeight: "600", color: "#1B5E20" },
  statusCancelledText: { color: "#C62828" },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: 13, color: "#888" },
  total: { fontSize: 16, fontWeight: "bold", color: "#1B5E20" },
  paymentMethod: { fontSize: 12, color: "#888", marginTop: 6 },
});
