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
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exotic plants..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
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
            color={activeFilterCount > 0 ? "#fff" : "#1B5E20"}
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
              <Ionicons name="close" size={14} color="#1B5E20" />
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
              <Ionicons name="close" size={14} color="#1B5E20" />
            </Pressable>
          )}
          {selectedPriceRange > 0 && (
            <Pressable
              style={styles.filterTag}
              onPress={() => setSelectedPriceRange(0)}
            >
              <Text style={styles.filterTagText}>{priceRange.label}</Text>
              <Ionicons name="close" size={14} color="#1B5E20" />
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
          <ActivityIndicator size="large" color="#1B5E20" />
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
                <Ionicons name="close" size={24} color="#333" />
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
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#1B5E20",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF5722",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  chipList: { maxHeight: 48 },
  chipContainer: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  chipActive: { backgroundColor: "#1B5E20", borderColor: "#1B5E20" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  activeFilters: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterTagText: { fontSize: 12, color: "#1B5E20", fontWeight: "600" },
  clearAll: { fontSize: 12, color: "#D32F2F", fontWeight: "600" },
  resultCount: { fontSize: 13, color: "#888", marginBottom: 8 },
  grid: { padding: 16, paddingTop: 12 },
  gridRow: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: "100%", height: 120, backgroundColor: "#E8F5E9" },
  cardPlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderEmoji: { fontSize: 36 },
  cardBody: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  cardCategory: { fontSize: 11, color: "#888", marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: "bold", color: "#1B5E20", marginTop: 4 },
  outOfStock: { fontSize: 11, color: "#D32F2F", fontWeight: "600", marginTop: 3 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#555" },
  emptySubtext: { fontSize: 14, color: "#888", marginTop: 4 },
  errorText: { fontSize: 16, color: "#D32F2F" },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
    marginTop: 16,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#1B5E20",
  },
  filterChipText: { fontSize: 13, color: "#666", fontWeight: "500" },
  filterChipTextActive: { color: "#1B5E20", fontWeight: "700" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
  },
  clearButtonText: { fontSize: 15, fontWeight: "600", color: "#666" },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1B5E20",
    alignItems: "center",
  },
  applyButtonText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
});
