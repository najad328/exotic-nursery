import { useState, useRef, useCallback } from "react";
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
  Share,
  Linking,
} from "react-native";
// Clipboard helper that works on both web and native
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getPlantBySlug } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";
import { useCartStore } from "../../stores/cartStore";
import { WhatsAppButton } from "../../components/WhatsAppButton";
import { buildPlantInquiryWhatsAppUrl } from "@exotic-nursery/utils";
import { colors, spacing, radius, shadows } from "../../theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PlantDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ["plant", slug],
    queryFn: () => getPlantBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
              ref={flatListRef}
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
                  resizeMode="contain"
                />
              )}
            />
            {allImages.length > 1 && activeImageIndex > 0 && (
              <Pressable
                style={[styles.carouselNav, styles.carouselNavLeft]}
                onPress={() => {
                  const newIndex = activeImageIndex - 1;
                  flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
                  setActiveImageIndex(newIndex);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={colors.white} />
              </Pressable>
            )}
            {allImages.length > 1 && activeImageIndex < allImages.length - 1 && (
              <Pressable
                style={[styles.carouselNav, styles.carouselNavRight]}
                onPress={() => {
                  const newIndex = activeImageIndex + 1;
                  flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
                  setActiveImageIndex(newIndex);
                }}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.white} />
              </Pressable>
            )}
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

          {/* Share */}
          <ShareBar plantName={plant.name} plantSlug={plant.slug} price={formatPriceINR(plant.price_paise)} />

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
                <Ionicons name="bulb" size={20} color={colors.orange} />
                <Text style={styles.tipsText}>{plant.care_tips}</Text>
              </View>
            </>
          )}

          {/* WhatsApp Inquiry */}
          <View style={{ marginTop: spacing.xl }}>
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
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(plantId);
      setAdded(true);
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
      {added ? (
        <Pressable
          style={[styles.addToCartButton, styles.goToCartButton]}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <Ionicons name="cart" size={22} color={colors.white} />
          <Text style={styles.addToCartText}>Go to Cart</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[
            styles.addToCartButton,
            outOfStock && styles.addToCartDisabled,
          ]}
          disabled={outOfStock || adding}
          onPress={handleAdd}
        >
          {adding ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="cart" size={22} color={colors.white} />
              <Text style={styles.addToCartText}>
                {outOfStock ? "Out of Stock" : "Add to Cart"}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

function ShareBar({
  plantName,
  plantSlug,
  price,
}: {
  plantName: string;
  plantSlug: string;
  price: string;
}) {
  const [copied, setCopied] = useState(false);

  // In production, replace with your actual deep link / web URL
  const shareUrl = `https://exotic-nursery.app/plant/${plantSlug}`;
  const shareMessage = `Check out ${plantName} at Exotic Nursery! ${price}\n${shareUrl}`;

  async function handleNativeShare() {
    try {
      await Share.share({
        message: shareMessage,
        title: `${plantName} — Exotic Nursery`,
      });
    } catch (_err) {
      // User cancelled
    }
  }

  function handleWhatsAppShare() {
    const encoded = encodeURIComponent(shareMessage);
    const url = `https://wa.me/?text=${encoded}`;
    Linking.openURL(url);
  }

  function handleFacebookShare() {
    const encoded = encodeURIComponent(shareUrl);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    Linking.openURL(url);
  }

  async function handleCopyLink() {
    if (Platform.OS === "web" && navigator?.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.shareContainer}>
      <Text style={styles.shareTitle}>Share this plant</Text>
      <View style={styles.shareRow}>
        <Pressable style={styles.shareBtn} onPress={handleWhatsAppShare}>
          <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
          <Text style={styles.shareBtnText}>WhatsApp</Text>
        </Pressable>

        <Pressable style={styles.shareBtn} onPress={handleFacebookShare}>
          <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          <Text style={styles.shareBtnText}>Facebook</Text>
        </Pressable>

        <Pressable style={styles.shareBtn} onPress={handleCopyLink}>
          <Ionicons
            name={copied ? "checkmark-circle" : "link"}
            size={20}
            color={copied ? colors.primary : colors.onSurfaceVariant}
          />
          <Text style={[styles.shareBtnText, copied && { color: colors.primary }]}>
            {copied ? "Copied!" : "Copy Link"}
          </Text>
        </Pressable>

        <Pressable style={styles.shareBtn} onPress={handleNativeShare}>
          <Ionicons name="share-outline" size={20} color={colors.onSurfaceVariant} />
          <Text style={styles.shareBtnText}>More</Text>
        </Pressable>
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
      <Ionicons name={icon} size={22} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: colors.primaryContainer,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  shareContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  shareTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shareRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
  },
  shareBtnText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: spacing.xl,
    borderRadius: spacing.xs,
  },
  dotInactive: {
    backgroundColor: `${colors.surface}B3`,
  },
  imageCounter: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  imageCounterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  carouselNav: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  carouselNavLeft: {
    left: spacing.md,
  },
  carouselNavRight: {
    right: spacing.md,
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  content: {
    padding: spacing.xl,
  },
  categoryBadge: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    backgroundColor: colors.primaryContainer,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.onBackground,
    marginTop: spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  comparePrice: {
    fontSize: 18,
    color: colors.textTertiary,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: colors.orangeLight,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.orange,
  },
  stock: {
    fontSize: 14,
    color: colors.success,
    fontWeight: "500",
    marginTop: 6,
  },
  stockOut: {
    color: colors.error,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.onBackground,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  careItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    width: "47%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  careLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  careValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onBackground,
    marginTop: 2,
    textAlign: "center",
  },
  tipsCard: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadows.lg,
  },
  bottomPrice: { marginRight: spacing.xs },
  bottomPriceLabel: { fontSize: 12, color: colors.textSecondary },
  bottomPriceValue: { fontSize: 20, fontWeight: "bold", color: colors.primary },
  addToCartButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  addToCartDisabled: {
    backgroundColor: colors.textTertiary,
  },
  addToCartAdded: {
    backgroundColor: colors.success,
  },
  goToCartButton: {
    backgroundColor: colors.orange,
  },
  addToCartText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
