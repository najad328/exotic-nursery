import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getPlantBySlug } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";

export default function PlantDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ["plant", slug],
    queryFn: () => getPlantBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (error || !plant) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Plant not found</Text>
      </View>
    );
  }

  const discount = plant.compare_at_price_paise
    ? Math.round(
        ((plant.compare_at_price_paise - plant.price_paise) /
          plant.compare_at_price_paise) *
          100
      )
    : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        {plant.image_url ? (
          <Image source={{ uri: plant.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🌿</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Category badge */}
          <Text style={styles.categoryBadge}>{plant.category?.name}</Text>

          {/* Name & Price */}
          <Text style={styles.name}>{plant.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPriceINR(plant.price_paise)}
            </Text>
            {plant.compare_at_price_paise && (
              <>
                <Text style={styles.comparePrice}>
                  {formatPriceINR(plant.compare_at_price_paise)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Stock */}
          <Text
            style={[
              styles.stock,
              plant.stock_quantity === 0 && styles.stockOut,
            ]}
          >
            {plant.stock_quantity > 0
              ? `${plant.stock_quantity} in stock`
              : "Out of stock"}
          </Text>

          {/* Description */}
          <Text style={styles.sectionTitle}>About this plant</Text>
          <Text style={styles.description}>{plant.description}</Text>

          {/* Care Info Grid */}
          <Text style={styles.sectionTitle}>Care Information</Text>
          <View style={styles.careGrid}>
            <CareItem
              icon="sunny"
              label="Sunlight"
              value={formatEnum(plant.sunlight)}
            />
            <CareItem
              icon="water"
              label="Watering"
              value={formatEnum(plant.watering)}
            />
            <CareItem
              icon="speedometer"
              label="Care Level"
              value={formatEnum(plant.care_level)}
            />
            {plant.max_height && (
              <CareItem
                icon="resize"
                label="Max Height"
                value={plant.max_height}
              />
            )}
            {plant.growth_time && (
              <CareItem
                icon="time"
                label="Growth Time"
                value={plant.growth_time}
              />
            )}
            {plant.origin && (
              <CareItem
                icon="globe"
                label="Origin"
                value={plant.origin}
              />
            )}
          </View>

          {/* Care Tips */}
          {plant.care_tips && (
            <>
              <Text style={styles.sectionTitle}>Care Tips</Text>
              <View style={styles.tipsCard}>
                <Ionicons name="bulb" size={20} color="#F9A825" />
                <Text style={styles.tipsText}>{plant.care_tips}</Text>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            plant.stock_quantity === 0 && styles.addToCartDisabled,
          ]}
          disabled={plant.stock_quantity === 0}
          onPress={() =>
            Alert.alert("Coming Soon", "Cart functionality is in Phase 3")
          }
        >
          <Ionicons name="cart" size={22} color="#fff" />
          <Text style={styles.addToCartText}>
            {plant.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CareItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.careItem}>
      <Ionicons name={icon} size={22} color="#1B5E20" />
      <Text style={styles.careLabel}>{label}</Text>
      <Text style={styles.careValue}>{value}</Text>
    </View>
  );
}

function formatEnum(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: "#E8F5E9",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "600",
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginTop: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  comparePrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#FFF3E0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E65100",
  },
  stock: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
    marginTop: 6,
  },
  stockOut: {
    color: "#D32F2F",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 24,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  careItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    width: "47%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  careLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
  },
  careValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
    textAlign: "center",
  },
  tipsCard: {
    backgroundColor: "#FFFDE7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  addToCartButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addToCartDisabled: {
    backgroundColor: "#999",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
