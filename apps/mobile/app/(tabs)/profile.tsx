import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { signOut } from "../../services/auth";

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            reset();
            router.replace("/(auth)/login");
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Failed to sign out";
            Alert.alert("Error", message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <MenuItem
          icon="person-outline"
          label="Edit Profile"
          onPress={() => Alert.alert("Coming Soon", "Profile editing is in Phase 3")}
        />
        <MenuItem
          icon="location-outline"
          label="Delivery Address"
          onPress={() => Alert.alert("Coming Soon", "Address management is in Phase 3")}
        />
        <MenuItem
          icon="receipt-outline"
          label="Order History"
          onPress={() => router.push("/(tabs)/orders")}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => Alert.alert("Coming Soon", "Support chat is in Phase 6")}
        />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color="#555" />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  menu: {
    backgroundColor: "#fff",
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuLabel: {
    fontSize: 16,
    color: "#333",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  signOutText: {
    fontSize: 16,
    color: "#D32F2F",
    fontWeight: "600",
  },
});
