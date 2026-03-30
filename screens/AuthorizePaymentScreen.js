import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";
import { useCart } from "../context/CartContext";

const BACKEND = "https://farm-land-deli-web.vercel.app"; // ← producción

export default function AuthorizePaymentScreen({ route, navigation }) {
  const [referenceId, setReferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payUrl, setPayUrl] = useState(null);
  const { clearCart } = useCart();

  const { amount, userId, cartItems } = route.params;

  useEffect(() => {
    const initTransaction = async () => {
      try {
        const refId = `FD-${Date.now()}`;
        const response = await fetch(
          `${BACKEND}/api/authorize/create-transaction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "bypass-tunnel-reminder": "true", // ← necesario para localtunnel
            },
            body: JSON.stringify({
              amount: Number(amount),
              referenceId: refId,
              userId: userId,
              cartItems: cartItems,
            }),
          },
        );
        const data = await response.json();
        setReferenceId(refId);
        setPayUrl(
          `${BACKEND}/pay?amount=${Number(amount).toFixed(2)}&referenceId=${refId}&userId=${userId}&cartItems=${encodeURIComponent(JSON.stringify(cartItems))}`,
        );
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        Toast.show({ type: "error", text1: "Error de conexión" });
      }
    };
    initTransaction();
  }, []);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "PAYMENT_SUCCESS") {
        clearCart();
        navigation.replace("OrderConfirmationScreen", {
          orderNumber: data.orderNumber,
          points: data.points || 0,
          userId: userId,
        });
      }
    } catch (err) {
      console.log("Error parsing message:", err);
    }
  };

  if (isLoading || !payUrl)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: payUrl }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFA500" />
          </View>
        )}
        style={{ flex: 1 }}
      />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
