import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { placeOrder } from "../services/orders";
import { supabase } from "../services/supabase";
import { formatPrice } from "@exotic-nursery/utils";
import { colors, radius, shadows, spacing } from "../theme";
import type { PaymentMethod } from "@exotic-nursery/types";

export default function CheckoutScreen() {
  const profile = useAuthStore((s) => s.profile);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotalPaise());
  const clearCart = useCartStore((s) => s.clearCart);

  const [form, setForm] = useState({
    delivery_name: profile?.full_name ?? "",
    delivery_phone: profile?.phone ?? "",
    delivery_address: profile?.address ?? "",
    delivery_city: profile?.city ?? "",
    delivery_pincode: profile?.pincode ?? "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);

  const deliveryFee = 0; // Free delivery for MVP
  const total = subtotal + deliveryFee;

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    if (key === "delivery_pincode") {
      setPincodeStatus("idle");
      setDeliveryDays(null);
    }
  }

  async function checkPincode() {
    const pincode = form.delivery_pincode.trim();
    if (pincode.length !== 6) {
      setError("Enter a valid 6-digit pincode");
      return;
    }

    setPincodeStatus("checking");
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
      const session = (await supabase.auth.getSession()).data.session;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/delivery_pincodes?pincode=eq.${pincode}&is_active=eq.true&select=pincode,area_name,city,delivery_days&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${session?.access_token ?? supabaseKey}`,
          },
        }
      );

      if (!res.ok) throw new Error("Network error");

      const rows = (await res.json()) as Array<{
        pincode: string;
        area_name: string | null;
        city: string | null;
        delivery_days: number;
      }>;

      if (rows.length > 0) {
        setPincodeStatus("available");
        setDeliveryDays(rows[0].delivery_days);
        if (!form.delivery_city && rows[0].city) {
          setForm((prev) => ({ ...prev, delivery_city: rows[0].city! }));
        }
      } else {
        setPincodeStatus("unavailable");
        setDeliveryDays(null);
      }
    } catch {
      setPincodeStatus("idle");
      setError("Failed to check pincode. Try again.");
    }
  }

  async function handlePlaceOrder() {
    // Validate
    if (!form.delivery_name.trim()) return setError("Name is required");
    if (!form.delivery_phone.trim()) return setError("Phone number is required");
    if (form.delivery_phone.trim().length < 10) return setError("Enter a valid phone number");
    if (!form.delivery_address.trim()) return setError("Address is required");
    if (!form.delivery_city.trim()) return setError("City is required");
    if (!form.delivery_pincode.trim()) return setError("Pincode is required");
    if (form.delivery_pincode.trim().length !== 6) return setError("Enter a valid 6-digit pincode");
    if (pincodeStatus !== "available") return setError("Please check pincode availability before placing the order");

    if (items.length === 0) return setError("Cart is empty");

    setPlacing(true);
    setError("");

    try {
      const orderId = await placeOrder(
        {
          delivery_name: form.delivery_name.trim(),
          delivery_phone: form.delivery_phone.trim(),
          delivery_address: form.delivery_address.trim(),
          delivery_city: form.delivery_city.trim(),
          delivery_pincode: form.delivery_pincode.trim(),
          notes: form.notes.trim() || undefined,
        },
        paymentMethod
      );

      // Clear local cart state
      await clearCart();

      // Navigate to confirmation
      router.replace(`/order/${orderId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      setError(message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {error !== "" && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.badge} style={{ marginRight: spacing.xs }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {item.plant.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryPrice}>
                {formatPrice(item.plant.price_paise * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryName}>Delivery</Text>
            <Text style={styles.freeDelivery}>FREE</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <Field
            label="Full Name"
            value={form.delivery_name}
            onChangeText={(v) => updateField("delivery_name", v)}
            placeholder="Your full name"
          />
          <Field
            label="Phone Number"
            value={form.delivery_phone}
            onChangeText={(v) => updateField("delivery_phone", v)}
            placeholder="10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Field
            label="Delivery Address"
            value={form.delivery_address}
            onChangeText={(v) => updateField("delivery_address", v)}
            placeholder="Street, area, landmark"
            multiline
          />
          {/* Pincode check */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Delivery Pincode *</Text>
            <View style={styles.pincodeRow}>
              <TextInput
                style={[styles.input, styles.pincodeInput]}
                value={form.delivery_pincode}
                onChangeText={(v) => updateField("delivery_pincode", v)}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Pressable
                style={[
                  styles.checkButton,
                  pincodeStatus === "checking" && { opacity: 0.6 },
                ]}
                onPress={checkPincode}
                disabled={pincodeStatus === "checking"}
              >
                {pincodeStatus === "checking" ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.checkButtonText}>Check</Text>
                )}
              </Pressable>
            </View>
            {pincodeStatus === "available" && (
              <View style={styles.pincodeSuccess}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.pincodeSuccessText}>
                  Delivery available! Estimated {deliveryDays} day{deliveryDays !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {pincodeStatus === "unavailable" && (
              <View style={styles.pincodeError}>
                <Ionicons name="close-circle" size={16} color={colors.badge} />
                <Text style={styles.pincodeErrorText}>
                  Sorry, we don't deliver to this pincode yet
                </Text>
              </View>
            )}
          </View>

          <Field
            label="City"
            value={form.delivery_city}
            onChangeText={(v) => updateField("delivery_city", v)}
            placeholder="City"
          />
          <Field
            label="Notes (optional)"
            value={form.notes}
            onChangeText={(v) => updateField("notes", v)}
            placeholder="Any delivery instructions"
            multiline
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Pressable
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentSelected,
            ]}
            onPress={() => setPaymentMethod("cod")}
          >
            <Text style={styles.paymentIcon}>💰</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Cash on Delivery</Text>
              <Text style={styles.paymentDesc}>Pay when your order arrives</Text>
            </View>
            <View
              style={[
                styles.radio,
                paymentMethod === "cod" && styles.radioSelected,
              ]}
            />
          </Pressable>
          <Pressable
            style={[
              styles.paymentOption,
              paymentMethod === "upi" && styles.paymentSelected,
              styles.paymentDisabled,
            ]}
            disabled
          >
            <Text style={styles.paymentIcon}>📱</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>UPI Payment</Text>
              <Text style={styles.paymentDesc}>Coming soon</Text>
            </View>
            <View style={styles.radio} />
          </Pressable>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerValue}>{formatPrice(total)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.placeOrderButton,
            (placing || items.length === 0) && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handlePlaceOrder}
          disabled={placing || items.length === 0}
        >
          {placing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.placeOrderText}>Placing Order…</Text>
            </View>
          ) : (
            <Text style={styles.placeOrderText}>Place Order (COD)</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: { color: colors.badge, fontSize: 14, flex: 1 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.onBackground,
    marginBottom: spacing.lg - 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
  },
  summaryName: { fontSize: 14, color: colors.onSurfaceVariant, flex: 1, marginRight: spacing.sm },
  summaryPrice: { fontSize: 14, color: colors.onBackground, fontWeight: "500" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.sm + 2,
  },
  totalLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  totalValue: { fontSize: 14, fontWeight: "600", color: colors.onBackground },
  freeDelivery: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.sm + 2,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: colors.onBackground },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  fieldContainer: { marginBottom: spacing.lg - 2 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant, marginBottom: spacing.xs + 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    backgroundColor: colors.surfaceContainer,
    color: colors.onBackground,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: spacing.md },
  halfField: { flex: 1 },
  pincodeRow: { flexDirection: "row", gap: spacing.sm + 2, alignItems: "center" },
  pincodeInput: { flex: 1 },
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonText: { color: colors.white, fontSize: 14, fontWeight: "bold" },
  pincodeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  pincodeSuccessText: { color: colors.success, fontSize: 13, fontWeight: "500" },
  pincodeError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  pincodeErrorText: { color: colors.badge, fontSize: 13, fontWeight: "500" },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg - 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm + 2,
  },
  paymentSelected: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  paymentDisabled: { opacity: 0.5 },
  paymentIcon: { fontSize: 24, marginRight: spacing.md },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontWeight: "600", color: colors.onBackground },
  paymentDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
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
    ...shadows.lg,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  footerLabel: { fontSize: 15, color: colors.onSurfaceVariant },
  footerValue: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  placeOrderButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  placeOrderText: { color: colors.white, fontSize: 17, fontWeight: "bold" },
});
