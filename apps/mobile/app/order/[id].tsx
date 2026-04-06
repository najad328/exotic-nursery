import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getOrderById } from "../../services/orders";
import { supabase } from "../../services/supabase";
import { formatPrice, buildOrderStatusWhatsAppUrl } from "@exotic-nursery/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "@exotic-nursery/types";
import type { OrderWithItems, OrderStatus, ShipmentEvent } from "@exotic-nursery/types";
import { WhatsAppButton } from "../../components/WhatsAppButton";
import { colors, spacing, radius, shadows } from "../../theme";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shipmentEvents, setShipmentEvents] = useState<ShipmentEvent[]>([]);

  useEffect(() => {
    if (!id) return;
    loadOrder();

    // Subscribe to real-time order status changes
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: (updated.status as OrderStatus) ?? prev.status,
              updated_at: (updated.updated_at as string) ?? prev.updated_at,
              tracking_number: (updated.tracking_number as string | null) ?? prev.tracking_number,
              courier_name: (updated.courier_name as string | null) ?? prev.courier_name,
              courier_tracking_url: (updated.courier_tracking_url as string | null) ?? prev.courier_tracking_url,
              estimated_delivery_at: (updated.estimated_delivery_at as string | null) ?? prev.estimated_delivery_at,
              shipped_at: (updated.shipped_at as string | null) ?? prev.shipped_at,
              awb_code: (updated.awb_code as string | null) ?? prev.awb_code,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Load shipment events + subscribe to new ones
  useEffect(() => {
    if (!id) return;
    async function loadEvents() {
      const { data } = await supabase
        .from("shipment_events" as "orders")
        .select("*")
        .eq("order_id" as "id", id!)
        .order("event_time" as "created_at", { ascending: false });
      if (data) setShipmentEvents(data as unknown as ShipmentEvent[]);
    }
    loadEvents();

    const eventsChannel = supabase
      .channel(`shipment-events-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_events",
          filter: `order_id=eq.${id}`,
        },
        (payload) => {
          const newEvent = payload.new as ShipmentEvent;
          setShipmentEvents((prev) => [newEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await getOrderById(id!);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Order not found"}</Text>
      </View>
    );
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Success Banner (for new orders) */}
      {order.status === "pending" && (
        <View style={styles.successBanner}>
          <Ionicons
            name="checkmark-circle"
            size={40}
            color={colors.primary}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been received and is being processed.
          </Text>
        </View>
      )}

      {/* Order Info */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Order Details</Text>
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
              {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </Text>
          </View>
        </View>
        <InfoRow label="Order ID" value={order.id.slice(0, 8).toUpperCase()} />
        <InfoRow
          label="Date"
          value={new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <InfoRow label="Payment" value={order.payment_method === "cod" ? "Cash on Delivery" : "UPI"} />
      </View>

      {/* Order Tracker */}
      {!isCancelled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Tracker</Text>
          {ORDER_STATUS_FLOW.map((status, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={status} style={styles.trackerStep}>
                <View style={styles.trackerLine}>
                  <View
                    style={[
                      styles.trackerDot,
                      isCompleted && styles.trackerDotCompleted,
                      isCurrent && styles.trackerDotCurrent,
                    ]}
                  />
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <View
                      style={[
                        styles.trackerConnector,
                        isCompleted && styles.trackerConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.trackerLabel,
                    isCompleted && styles.trackerLabelCompleted,
                    isCurrent && styles.trackerLabelCurrent,
                  ]}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Courier Tracking Card */}
      {order.awb_code && (
        <View style={[styles.section, styles.courierCard]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="car" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shipment Tracking</Text>
          </View>

          <View style={styles.courierGrid}>
            <View style={styles.courierItem}>
              <Text style={styles.courierLabel}>Courier</Text>
              <Text style={styles.courierValue}>{order.courier_name}</Text>
            </View>
            <View style={styles.courierItem}>
              <Text style={styles.courierLabel}>AWB #</Text>
              <Text style={[styles.courierValue, styles.courierAwb]}>
                {order.awb_code}
              </Text>
            </View>
            {order.estimated_delivery_at && (
              <View style={styles.courierItem}>
                <Text style={styles.courierLabel}>Est. Delivery</Text>
                <Text style={styles.courierValue}>
                  {new Date(order.estimated_delivery_at).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "long" }
                  )}
                </Text>
              </View>
            )}
          </View>

          {order.courier_tracking_url && (
            <Pressable
              style={styles.trackButton}
              onPress={() => {
                if (Platform.OS === "web") {
                  window.open(order.courier_tracking_url!, "_blank");
                } else {
                  Linking.openURL(order.courier_tracking_url!);
                }
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={styles.trackButtonText}>Track Shipment</Text>
              </View>
            </Pressable>
          )}

          {/* Shipment Events Timeline */}
          {shipmentEvents.length > 0 && (
            <View style={styles.eventsContainer}>
              <Text style={styles.eventsTitle}>Tracking Updates</Text>
              {shipmentEvents.map((event, idx) => (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.eventDotCol}>
                    <View
                      style={[
                        styles.eventDot,
                        idx === 0 && styles.eventDotActive,
                      ]}
                    />
                    {idx < shipmentEvents.length - 1 && (
                      <View style={styles.eventLine} />
                    )}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDesc}>{event.description}</Text>
                    <Text style={styles.eventMeta}>
                      {event.location ? `${event.location} · ` : ""}
                      {new Date(event.event_time).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.plant_name}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatPrice(item.price_paise * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {formatPrice(order.subtotal_paise)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.freeText}>FREE</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>
            {formatPrice(order.total_paise)}
          </Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.delivery_name}</Text>
        <Text style={styles.addressText}>{order.delivery_phone}</Text>
        <Text style={styles.addressText}>{order.delivery_address}</Text>
        <Text style={styles.addressText}>
          {order.delivery_city} - {order.delivery_pincode}
        </Text>
        {order.notes && (
          <Text style={styles.notesText}>Note: {order.notes}</Text>
        )}
      </View>

      {/* WhatsApp — contact nursery about this order */}
      <WhatsAppButton
        url={buildOrderStatusWhatsAppUrl(
          process.env.EXPO_PUBLIC_WHATSAPP_PHONE ?? "9999999999",
          order.delivery_name,
          order.id,
          order.status,
          formatPrice(order.total_paise)
        )}
        label="Contact Nursery on WhatsApp"
      />

      <Pressable
        style={[styles.backButton, { marginTop: spacing.md }]}
        onPress={() => router.push("/(tabs)/orders")}
      >
        <Text style={styles.backButtonText}>View All Orders</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.badge, fontSize: 15 },
  successBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  successTitle: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  successSubtitle: { fontSize: 14, color: colors.primary, marginTop: spacing.xs, textAlign: "center" },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: colors.onBackground },
  statusBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusCancelled: { backgroundColor: colors.errorContainer },
  statusText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  statusCancelledText: { color: colors.badge },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm - 2,
  },
  infoLabel: { fontSize: 14, color: colors.textTertiary },
  infoValue: { fontSize: 14, color: colors.onBackground, fontWeight: "500" },
  trackerStep: { flexDirection: "row", alignItems: "flex-start", minHeight: 44 },
  trackerLine: { alignItems: "center", width: spacing.xxl, marginRight: spacing.md },
  trackerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.outlineVariant,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  trackerDotCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackerDotCurrent: { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 3 },
  trackerConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.outlineVariant,
    minHeight: spacing.xxl,
  },
  trackerConnectorCompleted: { backgroundColor: colors.primary },
  trackerLabel: { fontSize: 14, color: colors.textTertiary, paddingTop: 0 },
  trackerLabelCompleted: { color: colors.primary },
  trackerLabelCurrent: { color: colors.primary, fontWeight: "bold" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: colors.onBackground, fontWeight: "500" },
  itemQty: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: colors.onBackground },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.md - 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 14, color: colors.onBackground },
  freeText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.md - 2,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: colors.onBackground },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  addressText: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22 },
  notesText: { fontSize: 13, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: "italic" },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  backButtonText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
  // Courier tracking styles
  courierCard: {
    borderColor: colors.outlineVariant,
    borderWidth: 1,
  },
  courierGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  courierItem: {
    minWidth: "45%" as unknown as number,
  },
  courierLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  courierValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onBackground,
    marginTop: 2,
  },
  courierAwb: {
    fontFamily: "monospace",
    color: colors.primary,
  },
  trackButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  trackButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  eventsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.md,
  },
  eventsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md - 2,
  },
  eventRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  eventDotCol: {
    alignItems: "center",
    width: spacing.xl,
    marginRight: spacing.md - 2,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.outlineVariant,
  },
  eventDotActive: {
    backgroundColor: colors.primary,
  },
  eventLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.outlineVariant,
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 14,
  },
  eventDesc: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onBackground,
  },
  eventMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
