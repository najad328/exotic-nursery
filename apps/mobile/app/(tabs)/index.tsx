import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getCategories, getFeaturedPlants } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";

export default function HomeScreen() {
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    data: featuredPlants,
    isLoading: plantsLoading,
  } = useQuery({
    queryKey: ["plants", "featured"],
    queryFn: getFeaturedPlants,
  });

  if (categoriesLoading || plantsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Discover Exotic Plants</Text>
        <Text style={styles.heroSubtitle}>
          Rare, beautiful, and delivered to your door
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
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
      </View>

      {/* Featured Plants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Plants</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredPlants}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.plantList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.plantCard}
              onPress={() => router.push(`/plant/${item.slug}`)}
            >
              {(item.image_url || (item.images && item.images.length > 0)) ? (
                <Image
                  source={{ uri: item.image_url || item.images?.[0] }}
                  style={styles.plantImage}
                />
              ) : (
                <View style={[styles.plantImage, styles.plantImagePlaceholder]}>
                  <Text style={styles.plantImagePlaceholderText}>🌱</Text>
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
      </View>

      <View style={{ height: 24 }} />
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
    backgroundColor: "#F5F5F5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    backgroundColor: "#1B5E20",
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#A5D6A7",
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: "#1B5E20",
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    alignItems: "center",
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    fontWeight: "500",
  },
  plantList: {
    gap: 14,
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  plantImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#E8F5E9",
  },
  plantImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  plantImagePlaceholderText: {
    fontSize: 48,
  },
  plantInfo: {
    padding: 12,
  },
  plantName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  plantCategory: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  plantPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  comparePrice: {
    fontSize: 13,
    color: "#999",
    textDecorationLine: "line-through",
  },
  badge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
