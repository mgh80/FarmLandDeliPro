import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ProductCard({ item }) {
  const navigation = useNavigation();
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        navigation.navigate("Products", {
          id: item.id,
          name: item.Name,
          description: item.Description,
          price: item.Price,
          image: item.Image,
        })
      }
    >
      <View
        style={{
          marginRight: 24,
          marginBottom: 24,
          backgroundColor: "white",
          borderRadius: 24,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 16,
          elevation: Platform.OS === "android" ? 12 : 0,
          width: 260,
          overflow: Platform.OS === "android" ? "hidden" : "visible",
        }}
      >
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          }}
        >
          {/* Loading Indicator */}
          {imageLoading && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <ActivityIndicator size="large" color="#4a90e2" />
            </View>
          )}

          {/* Expo Image con caché y optimización */}
          <Image
            source={
              item.Image
                ? { uri: item.Image }
                : require("../assets/images/placeholder.png")
            }
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
            transition={300}
            // Configuración de caché agresiva
            cachePolicy="memory-disk"
            placeholder={require("../assets/images/placeholder.png")}
            placeholderContentFit="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
            // Prioridad de carga
            priority="high"
          />
        </View>

        <View style={{ padding: 12 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}
            numberOfLines={2}
          >
            {item.Name}
          </Text>

          {item.Price != null && (
            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              ${item.Price.toFixed(2)}
            </Text>
          )}

          {item.Description && (
            <Text
              style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}
              numberOfLines={2}
            >
              {item.Description}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
