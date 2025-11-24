import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import * as Icon from "react-native-feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../constants/supabase"; // ✅ tu cliente Supabase
import { useCart } from "../context/CartContext";

export default function CartScreen({ navigation }) {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const [userId, setUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getTotalWithTax = () => getTotalPrice() * 1.06;

  // ✅ Obtener el usuario autenticado al cargar la pantalla
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("⚠️ Error obteniendo usuario:", error);
        } else if (data?.user) {
          setUserId(data.user.id);
        } else {
        }
      } catch (err) {
        console.error("💥 Error al obtener usuario:", err);
      }
    };

    fetchUser();
  }, []);

  // ✅ Confirmar y navegar a pantalla de pago
  const handleCheckout = async () => {
    if (isProcessing) return;

    if (!userId) {
      Alert.alert(
        "Login required",
        "You must log in to complete your purchase.."
      );
      return;
    }

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("¿Would you like to confirm and send your order??")
        : await new Promise((resolve) =>
            Alert.alert("Confirmation", "¿Confirm and send your order?", [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              { text: "Confirm", onPress: () => resolve(true) },
            ])
          );

    if (!confirmed) return;

    setIsProcessing(true);

    // ✅ Generar referencia única
    const referenceId = `FD-${Date.now()}-${getTotalWithTax().toFixed(2)}`;

    // ✅ Pasar datos a AuthorizePaymentScreen
    navigation.navigate("AuthorizePaymentScreen", {
      amount: getTotalWithTax(),
      referenceId,
      cartItems,
      userId, // ✅ usuario autenticado
    });

    // 🔄 Reset flag
    setTimeout(() => setIsProcessing(false), 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#F9FAFB" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Cart ({getTotalItems()} product{getTotalItems() !== 1 ? "s" : ""})
      </Text>

      {/* ✅ Mostrar mensaje si el carrito está vacío */}
      {cartItems.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -50,
          }}
        >
          <Icon.ShoppingBag width={90} height={90} stroke="#9CA3AF" />
          <Text style={{ marginTop: 20, fontSize: 18, color: "#6B7280" }}>
            Your cart is empty
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={{
              marginTop: 30,
              backgroundColor: "#FFA500",
              paddingHorizontal: 25,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ============================== */}
          {/* 🔹 Lista de productos en el carrito */}
          {/* ============================== */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id?.toString() || item.name}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  padding: 10,
                  marginBottom: 10,
                  borderRadius: 10,
                  elevation: 2,
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 60, height: 60, borderRadius: 10 }}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {item.name}
                  </Text>

                  {/* 🔹 Controles de cantidad */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: 5,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        updateQuantity(item.id, Math.max(item.quantity - 1, 1))
                      }
                      style={{
                        backgroundColor: "#FFA500",
                        borderRadius: 20,
                        padding: 4,
                      }}
                    >
                      <Icon.Minus stroke="white" width={16} height={16} />
                    </TouchableOpacity>

                    <Text
                      style={{
                        marginHorizontal: 10,
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        backgroundColor: "#FFA500",
                        borderRadius: 20,
                        padding: 4,
                      }}
                    >
                      <Icon.Plus stroke="white" width={16} height={16} />
                    </TouchableOpacity>
                  </View>

                  <Text style={{ color: "#333" }}>
                    Subtotal: ${(item.price * item.quantity * 1.06).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Icon.Trash stroke="#FFA500" width={22} height={22} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          {/* ============================== */}
          {/* 🔹 Total y botón de pago */}
          {/* ============================== */}
          <Animatable.View
            animation="bounceInUp"
            duration={1000}
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              backgroundColor: "#FFA500",
              borderRadius: 20,
              padding: 15,
              alignItems: "center",
              elevation: 5,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Total: ${getTotalWithTax().toFixed(2)}
            </Text>
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isProcessing}
              style={{
                marginTop: 10,
                backgroundColor: isProcessing ? "#cccccc" : "white",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  color: isProcessing ? "#666666" : "#FFA500",
                  fontWeight: "bold",
                }}
              >
                {isProcessing ? "Processing..." : "Pay"}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </>
      )}
    </SafeAreaView>
  );
}
