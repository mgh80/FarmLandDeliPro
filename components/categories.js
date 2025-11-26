import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useCategories } from "../constants";

// 👉 Array simple con tus imágenes en orden
const categoryImages = [
  require("../assets/images/2.jpg"),
  require("../assets/images/3.jpg"),
  require("../assets/images/4.jpg"),
  require("../assets/images/5.jpg"),
  require("../assets/images/6.jpg"),
  require("../assets/images/7.jpg"),
  require("../assets/images/8.jpg"),
  require("../assets/images/9.jpg"),
  require("../assets/images/10.jpg"),
  require("../assets/images/11.jpg"),
  require("../assets/images/12.jpg"),
];

export default function Categories({ activeCategory, setActiveCategory }) {
  const categories = useCategories();

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 15 }}
      >
        {/* ALL */}
        <TouchableOpacity
          onPress={() => setActiveCategory(null)}
          style={{ alignItems: "center", marginRight: 16 }}
        >
          <View
            style={{
              padding: 8,
              borderRadius: 100,
              backgroundColor: activeCategory === null ? "#4B5563" : "#E5E7EB",
            }}
          >
            <Image
              source={require("../assets/images/1.jpg")} // Imagen de ALL
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          </View>
          <Text
            style={{
              fontSize: 12,
              color: activeCategory === null ? "#1F2937" : "#6B7280",
              fontWeight: activeCategory === null ? "600" : "400",
              marginTop: 4,
            }}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* CATEGORÍAS */}
        {categories.map((cat, index) => {
          const isActive = cat.Name === activeCategory;

          return (
            <TouchableOpacity
              key={cat.Id}
              onPress={() => setActiveCategory(cat.Name)}
              style={{ alignItems: "center", marginRight: 16 }}
            >
              <View
                style={{
                  padding: 8,
                  borderRadius: 100,
                  backgroundColor: isActive ? "#4B5563" : "#E5E7EB",
                }}
              >
                <Image
                  source={categoryImages[index]} // 👈 IMAGEN SEGÚN ÍNDICE
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              </View>

              <Text
                style={{
                  fontSize: 12,
                  color: isActive ? "#1F2937" : "#6B7280",
                  fontWeight: isActive ? "600" : "400",
                  marginTop: 4,
                }}
              >
                {cat.Name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
