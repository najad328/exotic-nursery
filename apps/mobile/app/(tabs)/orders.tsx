import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="receipt-outline" size={64} color="#CCC" />
      <Text style={styles.title}>No Orders Yet</Text>
      <Text style={styles.subtitle}>
        Your order history will appear here after your first purchase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
