import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPlants, getCategories } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";
import { colors, radius, shadows, spacing } from "../../theme";
import type { PlantFilters, CareLevel } from "@exotic-nursery/types";

const CARE_LEVELS = ["easy", "medium", "hard", "expert"] as const;
const PRICE_RANGES = [
  { label: "All", min: undefined, max: undefined },
  { label: "Under ₹500", min: undefined, max: 50000 },
  { label: "₹500 - ₹1000", min: 50000, max: 100000 },
  { label: "₹1000 - ₹2000", min: 100000, max: 200000 },
  { label: "₹2000 - ₹5000", min: 200000, max: 500000 },
  { label: "Above ₹5000", min: 500000, max: undefined },
] as const;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    params.category ?? ""
  );
  const [selectedCareLevel, setSelectedCareLevel] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const priceRange = PRICE_RANGES[selectedPriceRange];

  const filters: PlantFilters = {
    search: search.trim() || undefined,
    category_slug: selectedCategory || undefined,
    care_level: (selectedCareLevel || undefined) as CareLevel | undefined,
    min_price_paise: priceRange.min,
    max_price_paise: priceRange.max,
    sort_by: "newest",
    limit: 50,
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedCareLevel ? 1 : 0) + (selectedPriceRange > 0 ? 1 : 0);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plants", filters],
    queryFn: () => getPlants(filters),
  });

  const handleCategoryPress = useCallback(
    (slug: string) => {
      setSelectedCategory((prev) => (prev === slug ? "" : slug));
    },
    []
  );

  function clearFilters() {
    setSelectedCategory("");
    setSelectedCareLevel("");
    setSelectedPriceRange(0);
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exotic plants..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <Pressable
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options"
            size={20}
            color={activeFilterCount > 0 ? colors.surface : colors.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Category Chips */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipList}
        contentContainerStyle={styles.chipContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              selectedCategory === item.slug && styles.chipActive,
            ]}
            onPress={() => handleCategoryPress(item.slug)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === item.slug && styles.chipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          {selectedCategory !== "" && (
            <Pressable
              style={styles.filterTag}
              onPress={() => setSelectedCategory("")}
            >
              <Text style={styles.filterTagText}>
                {categories?.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory}
              </Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          )}
          {selectedCareLevel !== "" && (
            <Pressable
              style={styles.filterTag}
              onPress={() => setSelectedCareLevel("")}
            >
              <Text style={styles.filterTagText}>
                {selectedCareLevel.charAt(0).toUpperCase() + selectedCareLevel.slice(1)}
              </Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          )}
          {selectedPriceRange > 0 && (
            <Pressable
              style={styles.filterTag}
              onPress={() => setSelectedPriceRange(0)}
            >
              <Text style={styles.filterTagText}>{priceRange.label}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          )}
          <Pressable onPress={clearFilters}>
            <Text style={styles.clearAll}>Clear all</Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load plants</Text>
        </View>
      ) : (
        <FlatList
          data={result?.plants}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No plants found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search or filter
              </Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {result?.total ?? 0} plant{result?.total !== 1 ? "s" : ""} found
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/plant/${item.slug}`)}
            >
              {(item.image_url || (item.images && item.images.length > 0)) ? (
                <Image
                  source={{ uri: item.image_url || item.images?.[0] }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.cardImage, styles.cardPlaceholder]}>
                  <Text style={styles.placeholderEmoji}>🌱</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCategory} numberOfLines={1}>
                  {item.category?.name}
                </Text>
                <Text style={styles.cardPrice}>
                  {formatPriceINR(item.price_paise)}
                </Text>
                {item.stock_quantity === 0 && (
                  <Text style={styles.outOfStock}>Out of stock</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.onBackground} />
              </Pressable>
            </View>

            {/* Category */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterChips}>
              {categories?.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.filterChip,
                    selectedCategory === cat.slug && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory((prev) => (prev === cat.slug ? "" : cat.slug))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === cat.slug && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Care Level */}
            <Text style={styles.filterSectionTitle}>Care Level</Text>
            <View style={styles.filterChips}>
              {CARE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.filterChip,
                    selectedCareLevel === level && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCareLevel((prev) => (prev === level ? "" : level))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCareLevel === level && styles.filterChipTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Price Range */}
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.filterChips}>
              {PRICE_RANGES.map((range, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.filterChip,
                    selectedPriceRange === idx && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedPriceRange(idx)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPriceRange === idx && styles.filterChipTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>
                  Apply Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.onBackground },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 16,
    height: 16,
    borderRadius: spacing.sm,
    backgroundColor: colors.badge,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: { color: colors.surface, fontSize: 10, fontWeight: "bold" },
  chipList: { maxHeight: 48 },
  chipContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.onSurfaceVariant, fontWeight: "500" },
  chipTextActive: { color: colors.primary },
  activeFilters: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterTagText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  clearAll: { fontSize: 12, color: colors.error, fontWeight: "600" },
  resultCount: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  grid: { padding: spacing.lg, paddingTop: spacing.md },
  gridRow: { gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  cardImage: { width: "100%", height: 120, backgroundColor: colors.primaryContainer },
  cardPlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderEmoji: { fontSize: 36 },
  cardBody: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "bold", color: colors.onBackground },
  cardCategory: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: "bold", color: colors.primary, marginTop: spacing.xs },
  outOfStock: { fontSize: 11, color: colors.error, fontWeight: "600", marginTop: 3 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: 18, fontWeight: "bold", color: colors.onSurfaceVariant },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  errorText: { fontSize: 16, color: colors.error },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: colors.onBackground },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: 10,
    marginTop: spacing.lg,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  filterChipText: { fontSize: 13, color: colors.onSurfaceVariant, fontWeight: "500" },
  filterChipTextActive: { color: colors.primary, fontWeight: "700" },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 28,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
  },
  clearButtonText: { fontSize: 15, fontWeight: "600", color: colors.onSurfaceVariant },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  applyButtonText: { fontSize: 15, fontWeight: "bold", color: colors.surface },
});
