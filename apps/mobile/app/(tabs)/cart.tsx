import { useCallback } from "react";
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
import { colors, radius, shadows, spacing } from "../../theme";

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🌿</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse our exotic plant collection and add some beauties!
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.browseButton,
            pressed && { opacity: 0.85 },
          ]}
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
                hitSlop={8}
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
                  style={({ pressed }) => [
                    styles.qtyButton,
                    pressed && { opacity: 0.7 },
                  ]}
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
                  style={({ pressed }) => [
                    styles.qtyButton,
                    item.quantity >= item.plant.stock_quantity &&
                      styles.qtyButtonDisabled,
                    pressed &&
                      item.quantity < item.plant.stock_quantity && {
                        opacity: 0.7,
                      },
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
            pressed && { opacity: 0.85 },
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
  /* Layout */
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },

  /* Empty state */
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.onBackground,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.xxxl,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.xl,
  },
  browseButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },

  /* Error */
  errorBanner: {
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
  },

  /* List */
  list: { padding: spacing.lg, paddingBottom: 180 },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },

  /* Thumbnail */
  image: { width: 72, height: 72, borderRadius: radius.md },
  imagePlaceholder: {
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: { fontSize: 28 },

  /* Item info */
  info: { flex: 1, marginLeft: spacing.md },
  plantName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onBackground,
  },
  price: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  unavailable: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
  lowStock: {
    fontSize: 12,
    color: colors.tertiary,
    marginTop: 2,
  },

  /* Remove */
  removeButton: { padding: spacing.sm },
  removeText: { fontSize: 15, color: colors.textTertiary },

  /* Quantity row */
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onBackground,
  },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonDisabled: { opacity: 0.35 },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: spacing.lg,
    color: colors.onBackground,
    minWidth: 20,
    textAlign: "center",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
    ...shadows.md,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  footerLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footerValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.onBackground,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  checkoutText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
  },
});
