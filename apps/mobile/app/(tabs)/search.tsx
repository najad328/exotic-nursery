import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPlants, getCategories } from "../../services/plants";
import { formatPriceINR } from "@exotic-nursery/types";
import type { PlantFilters } from "@exotic-nursery/types";

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    params.category ?? ""
  );

  const filters: PlantFilters = {
    search: search.trim() || undefined,
    category_slug: selectedCategory || undefined,
    sort_by: "newest",
    limit: 50,
  };

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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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
                Try a different search or category
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
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
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
    </View>
  );
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
    paddingTop: 60,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  chipList: {
    maxHeight: 48,
  },
  chipContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  chipActive: {
    backgroundColor: "#1B5E20",
    borderColor: "#1B5E20",
  },
  chipText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  resultCount: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  grid: {
    padding: 16,
    paddingTop: 12,
  },
  gridRow: {
    gap: 12,
  },
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
  cardImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#E8F5E9",
  },
  cardPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  cardCategory: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1B5E20",
    marginTop: 4,
  },
  outOfStock: {
    fontSize: 11,
    color: "#D32F2F",
    fontWeight: "600",
    marginTop: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
  },
});
