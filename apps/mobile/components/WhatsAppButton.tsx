import { Pressable, Text, StyleSheet, Linking, Platform } from "react-native";

interface WhatsAppButtonProps {
  url: string;
  label?: string;
  compact?: boolean;
}

export function WhatsAppButton({
  url,
  label = "Chat on WhatsApp",
  compact = false,
}: WhatsAppButtonProps) {
  async function handlePress() {
    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank");
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback: copy message or open in browser
          await Linking.openURL(url);
        }
      }
    } catch {
      // Silently fail — user can manually open WhatsApp
    }
  }

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactButton,
          pressed && { opacity: 0.7 },
        ]}
        onPress={handlePress}
      >
        <Text style={styles.compactIcon}>💬</Text>
        <Text style={styles.compactText}>WhatsApp</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.8 },
      ]}
      onPress={handlePress}
    >
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 20 },
  text: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  compactButton: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactIcon: { fontSize: 14 },
  compactText: { color: "#25D366", fontSize: 13, fontWeight: "600" },
});
