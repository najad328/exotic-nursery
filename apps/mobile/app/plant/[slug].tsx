import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getPlantBySlug } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";
import { useCartStore } from "../../stores/cartStore";
import { WhatsAppButton } from "../../components/WhatsAppButton";
import { buildPlantInquiryWhatsAppUrl } from "@exotic-nursery/utils";

const SCREEN_WIDTH = Dimensions.get("window").width;

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

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Combine primary image + additional images into a single array
  const allImages: string[] = [];
  if (plant.image_url) allImages.push(plant.image_url);
  if (plant.images && Array.isArray(plant.images)) {
    for (const img of plant.images) {
      if (img && !allImages.includes(img)) allImages.push(img);
    }
  }

  const discount = plant.compare_at_price_paise
    ? Math.round(
        ((plant.compare_at_price_paise - plant.price_paise) /
          plant.compare_at_price_paise) *
          100
      )
    : null;

  function handleImageScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {allImages.length > 0 ? (
          <View>
            <FlatList
              data={allImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, idx) => `img-${idx}`}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.image, { width: SCREEN_WIDTH }]}
                  resizeMode="cover"
                />
              )}
            />
            {allImages.length > 1 && (
              <View style={styles.dotsContainer}>
                {allImages.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === activeImageIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
            {allImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {activeImageIndex + 1}/{allImages.length}
                </Text>
              </View>
            )}
          </View>
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

          {/* WhatsApp Inquiry */}
          <View style={{ marginTop: 20 }}>
            <WhatsAppButton
              url={buildPlantInquiryWhatsAppUrl(
                process.env.EXPO_PUBLIC_WHATSAPP_PHONE ?? "9999999999",
                plant.name
              )}
              label="Ask about this plant"
              compact
            />
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <AddToCartBar
        plantId={plant.id}
        stockQuantity={plant.stock_quantity}
        pricePaise={plant.price_paise}
      />
    </View>
  );
}

function AddToCartBar({
  plantId,
  stockQuantity,
  pricePaise,
}: {
  plantId: string;
  stockQuantity: number;
  pricePaise: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(plantId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      if (Platform.OS === "web") {
        window.alert("Failed to add to cart. Please try again.");
      }
    } finally {
      setAdding(false);
    }
  }

  const outOfStock = stockQuantity === 0;

  return (
    <View style={styles.bottomBar}>
      <View style={styles.bottomPrice}>
        <Text style={styles.bottomPriceLabel}>Price</Text>
        <Text style={styles.bottomPriceValue}>
          {formatPriceINR(pricePaise)}
        </Text>
      </View>
      <Pressable
        style={[
          styles.addToCartButton,
          outOfStock && styles.addToCartDisabled,
          added && styles.addToCartAdded,
        ]}
        disabled={outOfStock || adding}
        onPress={handleAdd}
      >
        {adding ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons
              name={added ? "checkmark-circle" : "cart"}
              size={22}
              color="#fff"
            />
            <Text style={styles.addToCartText}>
              {outOfStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
            </Text>
          </>
        )}
      </Pressable>
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
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#1B5E20",
    width: 20,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPrice: { marginRight: 4 },
  bottomPriceLabel: { fontSize: 12, color: "#888" },
  bottomPriceValue: { fontSize: 20, fontWeight: "bold", color: "#1B5E20" },
  addToCartButton: {
    flex: 1,
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addToCartDisabled: {
    backgroundColor: "#999",
  },
  addToCartAdded: {
    backgroundColor: "#2E7D32",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
