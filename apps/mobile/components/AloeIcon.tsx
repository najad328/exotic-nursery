import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

type AloeIconProps = {
  size?: number;
  color?: string;
};

/**
 * Aloe AI — Custom icon for the plant care assistant.
 * Combines a leaf icon with an AI sparkle accent.
 */
export function AloeIcon({ size = 28, color = colors.primary }: AloeIconProps) {
  const sparkleSize = Math.round(size * 0.4);
  return (
    <View style={{ width: size, height: size }}>
      <Ionicons name="leaf" size={size * 0.85} color={color} style={{ marginTop: size * 0.1 }} />
      {/* AI sparkle accent */}
      <View style={[styles.sparkle, { top: -1, right: -2 }]}>
        <Ionicons name="sparkles" size={sparkleSize} color={colors.orange} />
      </View>
    </View>
  );
}

/**
 * Large Aloe AI avatar for empty state and headers.
 * Green circle with aloe leaf + sparkle.
 */
export function AloeAvatar({ size = 80 }: { size?: number }) {
  const iconSize = Math.round(size * 0.45);
  const sparkleSize = Math.round(size * 0.22);
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <View>
        <Ionicons name="leaf" size={iconSize} color={colors.primary} />
        <View style={[styles.avatarSparkle, { top: -4, right: -6 }]}>
          <Ionicons name="sparkles" size={sparkleSize} color={colors.orange} />
        </View>
      </View>
    </View>
  );
}

/**
 * Compact Aloe AI badge for chat bubbles.
 */
export function AloeBadge() {
  return (
    <View style={styles.badgeRow}>
      <View style={styles.badgeIconCircle}>
        <Ionicons name="leaf" size={10} color={colors.primary} />
        <View style={styles.badgeSparkle}>
          <Ionicons name="sparkles" size={6} color={colors.orange} />
        </View>
      </View>
      <Text style={styles.badgeName}>Aloe AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: "absolute",
  },
  avatarCircle: {
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSparkle: {
    position: "absolute",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  badgeIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeSparkle: {
    position: "absolute",
    top: -2,
    right: -3,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
