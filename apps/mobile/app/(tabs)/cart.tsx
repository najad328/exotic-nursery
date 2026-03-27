import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCartStore } from "../../stores/cartStore";
import { formatPrice } from "@exotic-nursery/utils";

export default function CartScreen() {
  const { items, loading, error, fetchCart, updateQuantity, removeItem } =
    useCartStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotalPaise());

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse our exotic plant collection and add some beauties!
        </Text>
        <Pressable
          style={styles.browseButton}
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text style={styles.browseButtonText}>Browse Plants</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              {item.plant.image_url ? (
                <Image
                  source={{ uri: item.plant.image_url }}
                  style={styles.image}
                />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderEmoji}>🌱</Text>
                </View>
              )}

              <View style={styles.info}>
                <Text style={styles.plantName} numberOfLines={2}>
                  {item.plant.name}
                </Text>
                <Text style={styles.price}>
                  {formatPrice(item.plant.price_paise)}
                </Text>
                {!item.plant.is_active && (
                  <Text style={styles.unavailable}>Unavailable</Text>
                )}
                {item.plant.is_active &&
                  item.plant.stock_quantity < item.quantity && (
                    <Text style={styles.lowStock}>
                      Only {item.plant.stock_quantity} left
                    </Text>
                  )}
              </View>

              <Pressable
                onPress={() => removeItem(item.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.itemTotal}>
                {formatPrice(item.plant.price_paise * item.quantity)}
              </Text>
              <View style={styles.quantityControls}>
                <Pressable
                  style={styles.qtyButton}
                  onPress={() =>
                    item.quantity <= 1
                      ? removeItem(item.id)
                      : updateQuantity(item.id, item.quantity - 1)
                  }
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={[
                    styles.qtyButton,
                    item.quantity >= item.plant.stock_quantity &&
                      styles.qtyButtonDisabled,
                  ]}
                  disabled={item.quantity >= item.plant.stock_quantity}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>
            Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})
          </Text>
          <Text style={styles.footerValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
  },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  browseButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EF9A9A",
  },
  errorText: { color: "#C62828", fontSize: 13, textAlign: "center" },
  list: { padding: 16, paddingBottom: 180 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  image: { width: 70, height: 70, borderRadius: 10 },
  imagePlaceholder: {
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: { fontSize: 28 },
  info: { flex: 1, marginLeft: 12 },
  plantName: { fontSize: 15, fontWeight: "600", color: "#333" },
  price: { fontSize: 14, color: "#1B5E20", fontWeight: "600", marginTop: 4 },
  unavailable: { fontSize: 12, color: "#C62828", marginTop: 2 },
  lowStock: { fontSize: 12, color: "#E65100", marginTop: 2 },
  removeButton: { padding: 6 },
  removeText: { fontSize: 16, color: "#999" },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  itemTotal: { fontSize: 16, fontWeight: "bold", color: "#333" },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonDisabled: { opacity: 0.4 },
  qtyButtonText: { fontSize: 18, fontWeight: "bold", color: "#1B5E20" },
  qtyValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    color: "#333",
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  footerLabel: { fontSize: 15, color: "#666" },
  footerValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  checkoutButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
