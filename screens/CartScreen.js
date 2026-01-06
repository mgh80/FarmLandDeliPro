import { useCallback, useEffect, useState } from "react";
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
import { supabase } from "../constants/supabase";
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("⚠️ Error obteniendo usuario:", error);
        } else if (data?.user) {
          setUserId(data.user.id);
        }
      } catch (err) {
        console.error("💥 Error al obtener usuario:", err);
      }
    };

    fetchUser();
  }, []);

  const handleCheckout = useCallback(async () => {
    if (isProcessing) return;

    if (!userId) {
      Alert.alert(
        "Login required",
        "You must log in to complete your purchase."
      );
      return;
    }

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Would you like to confirm and send your order?")
        : await new Promise((resolve) =>
            Alert.alert("Confirmation", "Confirm and send your order?", [
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

    const referenceId = `FD-${Date.now()}-${getTotalWithTax().toFixed(2)}`;

    navigation.navigate("AuthorizePaymentScreen", {
      amount: getTotalWithTax(),
      referenceId,
      cartItems,
      userId,
    });

    setTimeout(() => setIsProcessing(false), 1000);
  }, [isProcessing, userId, cartItems, navigation, getTotalWithTax]);

  // FIX: Funciones memoizadas para mejor rendimiento
  const handleRemoveItem = useCallback((itemId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeFromCart(itemId);
          },
        },
      ]
    );
  }, [removeFromCart]);

  // FIX: Componente separado para cada item del carrito
  const CartItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 10,
        marginBottom: 10,
        borderRadius: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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

        {/* Controles de cantidad - OPTIMIZADO */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 5,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              const newQuantity = Math.max(item.quantity - 1, 1);
              updateQuantity(item.id, newQuantity);
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              backgroundColor: "#FFA500",
              borderRadius: 20,
              padding: 6,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.Minus stroke="white" width={16} height={16} />
          </TouchableOpacity>

          <Text
            style={{
              marginHorizontal: 15,
              fontSize: 16,
              fontWeight: "bold",
              minWidth: 20,
              textAlign: "center",
            }}
          >
            {item.quantity}
          </Text>

          <TouchableOpacity
            onPress={() => {
              updateQuantity(item.id, item.quantity + 1);
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              backgroundColor: "#FFA500",
              borderRadius: 20,
              padding: 6,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.Plus stroke="white" width={16} height={16} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: "#333", fontSize: 14 }}>
          Subtotal: ${(item.price * item.quantity * 1.06).toFixed(2)}
        </Text>
      </View>

      {/* FIX: Botón de eliminar con mejor área táctil */}
      <TouchableOpacity
        onPress={() => handleRemoveItem(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={{
          padding: 8,
          marginLeft: 5,
        }}
      >
        <Icon.Trash stroke="#FFA500" width={24} height={24} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#F9FAFB" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Cart ({getTotalItems()} product{getTotalItems() !== 1 ? "s" : ""})
      </Text>

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
            activeOpacity={0.7}
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
          {/* Lista de productos en el carrito - OPTIMIZADO */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id?.toString() || item.name}
            renderItem={({ item }) => <CartItem item={item} />}
            contentContainerStyle={{ paddingBottom: 120 }}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={30}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 90,
              offset: 90 * index,
              index,
            })}
          />

          {/* Total y botón de pago */}
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
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Total: ${getTotalWithTax().toFixed(2)}
            </Text>
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isProcessing}
              activeOpacity={0.7}
              style={{
                marginTop: 10,
                backgroundColor: isProcessing ? "#cccccc" : "white",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 30,
              }}
            >
              <Text
                style={{
                  color: isProcessing ? "#666666" : "#FFA500",
                  fontWeight: "bold",
                  fontSize: 16,
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