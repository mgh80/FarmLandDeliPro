import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import ProductCard from "./productCard";

export default function FeaturedRow({ title, description, products = [] }) {
  // Memoized render function para mejor performance
  const renderProduct = useCallback(
    ({ item }) => <ProductCard item={item} />,
    [],
  );

  // Extractor de key optimizado
  const keyExtractor = useCallback(
    (item, index) =>
      item.id?.toString() || item.Id?.toString() || `product-${index}`,
    [],
  );

  // Función que determina qué items están cerca del viewport
  const getItemLayout = useCallback(
    (data, index) => ({
      length: 284, // 260 (width) + 24 (marginRight)
      offset: 284 * index,
      index,
    }),
    [],
  );

  if (!products || products.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {/* FlatList optimizado */}
      <FlatList
        horizontal
        data={products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        // Optimizaciones críticas
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        updateCellsBatchingPeriod={50}
        // Mejora significativa de performance
        getItemLayout={getItemLayout}
        // Evita re-renders innecesarios
        extraData={products.length}
        // Mejora el scroll en Android
        decelerationRate="fast"
        // Reduce el overshoot en iOS
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
  },
  description: {
    fontSize: 12,
    color: "#718096",
    marginTop: 4,
  },
});
