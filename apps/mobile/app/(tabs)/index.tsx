import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getCategories, getFeaturedPlants } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";
import { colors, radius, shadows, spacing } from "../../theme";
import {
  Skeleton,
  SkeletonCategoryChip,
  SkeletonPlantCard,
} from "../../components/Skeleton";

export default function HomeScreen() {
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    data: featuredPlants,
    isLoading: plantsLoading,
    isError: plantsError,
    refetch: refetchPlants,
  } = useQuery({
    queryKey: ["plants", "featured"],
    queryFn: getFeaturedPlants,
  });

  const isLoading = categoriesLoading || plantsLoading;
  const isError = categoriesError || plantsError;

  function handleRetry() {
    void refetchCategories();
    void refetchPlants();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/search")}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <Text style={styles.searchPlaceholder}>Search for exotic plants...</Text>
      </TouchableOpacity>

      {/* Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover{"\n"}Exotic Plants</Text>
          <Text style={styles.heroSubtitle}>
            Rare, beautiful, and delivered to your door
          </Text>
        </View>
      </View>

      {/* Error state */}
      {isError && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Couldn't load plants</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        {isLoading ? (
          <View style={styles.skeletonRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCategoryChip key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() =>
                  router.push(`/(tabs)/search?category=${item.slug}`)
                }
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>
                    {getCategoryEmoji(item.slug)}
                  </Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Featured Plants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Plants</Text>
          {!isLoading && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/search")}
              hitSlop={8}
            >
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading ? (
          <View style={styles.skeletonRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPlantCard key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={featuredPlants}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.plantList}
            ListEmptyComponent={
              <View style={styles.emptyPlants}>
                <Text style={styles.emptyPlantsText}>No featured plants right now.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.plantCard}
                onPress={() => router.push(`/plant/${item.slug}`)}
                activeOpacity={0.8}
              >
                {(item.image_url || (item.images && item.images.length > 0)) ? (
                  <Image
                    source={{ uri: item.image_url || item.images?.[0] }}
                    style={styles.plantImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.plantImage, styles.plantImagePlaceholder]}>
                    <Text style={styles.plantImagePlaceholderText}>🌿</Text>
                  </View>
                )}
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.plantCategory} numberOfLines={1}>
                    {item.category?.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.plantPrice}>
                      {formatPriceINR(item.price_paise)}
                    </Text>
                    {item.compare_at_price_paise && (
                      <Text style={styles.comparePrice}>
                        {formatPriceINR(item.compare_at_price_paise)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.care_level}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    "tropical-fruits": "🍍",
    "rare-flowers": "🌺",
    "carnivorous-plants": "🪴",
    "succulents-cacti": "🌵",
    "aroids-foliage": "🍃",
    bonsai: "🌳",
  };
  return map[slug] ?? "🌿";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: spacing.xxl,
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primaryDark,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },

  // Error state
  errorContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onBackground,
    marginTop: spacing.sm,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },

  // Skeleton rows
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },

  categoryList: {
    gap: spacing.lg,
  },
  categoryCard: {
    alignItems: "center",
    width: 76,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    fontWeight: "500",
  },
  plantList: {
    gap: spacing.md,
  },
  plantCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: 180,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: "hidden",
    ...shadows.sm,
  },
  plantImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.surfaceContainer,
  },
  plantImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  plantImagePlaceholderText: {
    fontSize: 40,
  },
  plantInfo: {
    padding: spacing.md,
  },
  plantName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onBackground,
  },
  plantCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  plantPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  comparePrice: {
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: "line-through",
  },
  badge: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyPlants: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyPlantsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
