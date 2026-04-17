/**
 * Skeleton / Shimmer loading placeholders.
 *
 * Usage:
 *   <Skeleton width={120} height={16} />
 *   <Skeleton width="100%" height={200} borderRadius={12} />
 *   <SkeletonPlantCard />
 *   <SkeletonOrderCard />
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme";

// ---------------------------------------------------------------------------
// Base Skeleton block — animated shimmer
// ---------------------------------------------------------------------------

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width, height, borderRadius = radius.sm, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonPlantCard — matches the 180×(150+info) plant card shape
// ---------------------------------------------------------------------------

export function SkeletonPlantCard() {
  return (
    <View style={plantStyles.card}>
      {/* image */}
      <Skeleton width="100%" height={150} borderRadius={0} />
      {/* info */}
      <View style={plantStyles.info}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={11} style={{ marginTop: spacing.xs }} />
        <Skeleton width="40%" height={16} style={{ marginTop: spacing.sm }} />
        <Skeleton width={56} height={22} borderRadius={radius.sm} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

const plantStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: 180,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: "hidden",
  },
  info: {
    padding: spacing.md,
    gap: 0,
  },
});

// ---------------------------------------------------------------------------
// SkeletonCategoryChip — matches the 76-wide category circle
// ---------------------------------------------------------------------------

export function SkeletonCategoryChip() {
  return (
    <View style={chipStyles.wrapper}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <Skeleton width={52} height={10} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: 76,
    gap: 0,
  },
});

// ---------------------------------------------------------------------------
// SkeletonOrderCard — matches the order list card
// ---------------------------------------------------------------------------

export function SkeletonOrderCard() {
  return (
    <View style={orderStyles.card}>
      {/* header row: order id + status badge */}
      <View style={orderStyles.row}>
        <Skeleton width={120} height={14} />
        <Skeleton width={72} height={22} borderRadius={radius.full} />
      </View>
      {/* body row: date + amount */}
      <View style={[orderStyles.row, { marginTop: spacing.md }]}>
        <Skeleton width={100} height={12} />
        <Skeleton width={64} height={16} />
      </View>
      {/* divider */}
      <View style={orderStyles.divider} />
      {/* payment row */}
      <Skeleton width="60%" height={12} />
    </View>
  );
}

const orderStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: spacing.md,
  },
});
