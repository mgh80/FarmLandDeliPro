import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import * as Icon from "react-native-feather";

export default function ProductRow({ item }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        padding: 10,
        marginVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* 🖼️ Imagen */}
      <Image
        source={item.image}
        style={{
          width: 70,
          height: 70,
          borderRadius: 15,
          marginRight: 10,
        }}
      />

      {/* 📜 Info del producto */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: "gray" }}>{item.description}</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 5 }}>
          ${item.price}
        </Text>
      </View>

      {/* ➕➖ Botones para cambiar cantidad */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
          style={{
            padding: 6,
            backgroundColor: "orange",
            borderRadius: 50,
          }}
        >
          <Icon.Minus stroke="white" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={{ marginHorizontal: 10, fontSize: 16 }}>{quantity}</Text>

        <TouchableOpacity
          onPress={() => setQuantity(quantity + 1)}
          style={{
            padding: 6,
            backgroundColor: "orange",
            borderRadius: 50,
          }}
        >
          <Icon.Plus stroke="white" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
