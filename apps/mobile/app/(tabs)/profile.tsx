import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { deactivatePushTokens } from "../../services/notifications";
import { colors, radius, shadows, spacing } from "../../theme";

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name ?? "");
  const [editPhone, setEditPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSignOut() {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        try {
          if (user?.id) await deactivatePushTokens(user.id);
          await signOut();
          reset();
          router.replace("/(auth)/login");
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to sign out";
          window.alert(message);
        }
      }
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            if (user?.id) await deactivatePushTokens(user.id);
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

  function openEditProfile() {
    setEditName(profile?.full_name ?? "");
    setEditPhone(profile?.phone ?? "");
    setEditModalVisible(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      if (Platform.OS === "web") {
        window.alert("Name is required");
      } else {
        Alert.alert("Error", "Name is required");
      }
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
        })
        .eq("id", user?.id ?? "");

      if (error) throw error;

      await fetchProfile();
      setEditModalVisible(false);

      if (Platform.OS === "web") {
        window.alert("Profile updated successfully!");
      } else {
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleEmailPress() {
    Linking.openURL("mailto:support@exoticnursery.in?subject=Support%20Request");
  }

  function handlePhonePress() {
    Linking.openURL("tel:+919876543210");
  }

  function handleWhatsAppPress() {
    Linking.openURL("https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20my%20order");
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name || "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {profile?.phone && (
            <Text style={styles.phone}>{profile.phone}</Text>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={openEditProfile}
          />
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => router.push("/(tabs)/orders")}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => setHelpModalVisible(true)}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <Pressable onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.helpSubtitle}>
              Need help? Reach out to us through any of these channels:
            </Text>

            <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
              <View style={[styles.contactIcon, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="mail-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Us</Text>
                <Text style={styles.contactValue}>support@exoticnursery.in</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
              <View style={[styles.contactIcon, { backgroundColor: colors.tertiaryContainer }]}>
                <Ionicons name="call-outline" size={22} color={colors.tertiary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Call Us</Text>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleWhatsAppPress}>
              <View style={[styles.contactIcon, { backgroundColor: colors.successContainer }]}>
                <Ionicons name="logo-whatsapp" size={22} color={colors.whatsapp} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.outline} />
            </TouchableOpacity>

            <View style={styles.helpHours}>
              <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.helpHoursText}>
                Available Mon-Sat, 9 AM - 6 PM IST
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
        <Ionicons name={icon} size={22} color={colors.onSurfaceVariant} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.onBackground,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  phone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menu: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.onSurface,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
    paddingVertical: 14,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.onBackground,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainer,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: "center",
  },
  disabledText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  // Help & Support styles
  helpSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    gap: 14,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
  },
  contactValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helpHours: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xl,
    justifyContent: "center",
  },
  helpHoursText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
