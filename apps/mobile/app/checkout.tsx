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
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { placeOrder } from "../services/orders";
import { formatPrice } from "@exotic-nursery/utils";
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

  const deliveryFee = 0; // Free delivery for MVP
  const total = subtotal + deliveryFee;

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
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
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Field
                label="City"
                value={form.delivery_city}
                onChangeText={(v) => updateField("delivery_city", v)}
                placeholder="City"
              />
            </View>
            <View style={styles.halfField}>
              <Field
                label="Pincode"
                value={form.delivery_pincode}
                onChangeText={(v) => updateField("delivery_pincode", v)}
                placeholder="6-digit"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>
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
            <ActivityIndicator color="#fff" />
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
        placeholderTextColor="#AAA"
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scroll: { padding: 16 },
  errorBox: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EF9A9A",
  },
  errorText: { color: "#C62828", fontSize: 14, textAlign: "center" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryName: { fontSize: 14, color: "#555", flex: 1, marginRight: 8 },
  summaryPrice: { fontSize: 14, color: "#333", fontWeight: "500" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 14, color: "#555" },
  totalValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  freeDelivery: { fontSize: 14, color: "#1B5E20", fontWeight: "600" },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 8,
    paddingTop: 10,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: "#1B5E20" },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    marginBottom: 10,
  },
  paymentSelected: { borderColor: "#1B5E20", backgroundColor: "#E8F5E9" },
  paymentDisabled: { opacity: 0.5 },
  paymentIcon: { fontSize: 24, marginRight: 12 },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  paymentDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CCC",
  },
  radioSelected: {
    borderColor: "#1B5E20",
    backgroundColor: "#1B5E20",
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
  footerValue: { fontSize: 18, fontWeight: "bold", color: "#1B5E20" },
  placeOrderButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  placeOrderText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
