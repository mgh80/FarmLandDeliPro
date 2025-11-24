import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useCategories } from "../constants";

export default function Categories({ activeCategory, setActiveCategory }) {
  const categories = useCategories();

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 15 }}
      >
        {/* Botón All */}
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
              source={require("../assets/images/1.jpg")}
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

        {/* Botones por categoría */}
        {categories.map((cat) => {
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
                  source={require("../assets/images/1.jpg")}
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
