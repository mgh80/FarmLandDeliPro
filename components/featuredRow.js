import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ProductCard from "./productCard";

export default function FeaturedRow({ title, description, products = [] }) {
  // Renderizar cada producto
  const renderProduct = ({ item }) => (
    <ProductCard item={item} />
  );

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {/* Scroll horizontal - FIX: Cambio de ScrollView a FlatList */}
      <FlatList
        horizontal
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => item.id?.toString() || item.Id?.toString() || `product-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={3}
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