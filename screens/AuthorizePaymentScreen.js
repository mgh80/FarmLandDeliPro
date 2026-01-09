import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";
import { useCart } from "../context/CartContext";

const getBackendUrl = () => {
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("localhost")
    ) {
      return "http://localhost:3000";
    }
    return "https://farm-land-deli-web.vercel.app";
  }
  return "https://farm-land-deli-web.vercel.app";
};

const BACKEND = getBackendUrl();

export default function AuthorizePaymentScreen({ route, navigation }) {
  const [token, setToken] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [referenceId, setReferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const verificationInProgress = useRef(false);

  const { cartItems, clearCart } = useCart();
  const amount = route?.params?.amount || 0.01;
  const userId = route?.params?.userId || null;
  const cartFromRoute = route?.params?.cartItems || [];

  // ===========================
  // 🔹 Deep linking listener
  // ===========================
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;

      if (url.includes("order-confirmation")) {
        const params = {};
        const queryString = url.split("?")[1];
        if (queryString) {
          queryString.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            params[key] = decodeURIComponent(value);
          });
        }

        clearCart();
        // ✅ Nombre correcto: OrderConfirmation
        navigation.replace("OrderConfirmation", {
          orderNumber: params.orderNumber,
          points: parseInt(params.pointsEarned) || 0,
          total: parseFloat(params.total) || 0,
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [navigation, clearCart]);

  // ===========================
  // 🔹 Crear transacción
  // ===========================
  useEffect(() => {
    const createTransaction = async () => {
      try {
        const refId =
          route?.params?.referenceId || `FD-${Date.now()}-${amount.toFixed(2)}`;

        const cleanCartItems = (cartFromRoute || []).map((item) => ({
          id: item.id || item.productid || item.ProductID,
          quantity: item.quantity || 1,
        }));

        const response = await fetch(
          `${BACKEND}/api/authorize/create-transaction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              amount: Number(amount.toFixed(2)),
              referenceId: refId,
              cartItems: cleanCartItems,
              userId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok)
          throw new Error(data.error || "Error creando transacción");

        if (!data.token)
          throw new Error("No se recibió token de Authorize.Net");

        setToken(data.token);
        setCheckoutUrl(data.checkoutUrl);
        setReferenceId(refId);
        setIsLoading(false);
      } catch (err) {        
        setError(err.message);
        setIsLoading(false);
      }
    };

    createTransaction();
  }, [amount, userId, cartFromRoute]);

  // ===========================
  // 🔹 Redirección Web
  // ===========================
  useEffect(() => {
    if (Platform.OS === "web" && token) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://test.authorize.net/payment/payment";
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token";
      input.value = token;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
    }
  }, [token]);

  // ===========================
  // 🔹 Verificar pago
  // ===========================
  const verifyPayment = async (retryCount = 0) => {
    if (verificationInProgress.current) {
      return;
    }

    verificationInProgress.current = true;

    try {     

      const verifyUrl = `${BACKEND}/api/authorize/check-payment-status?referenceId=${referenceId}`;
      const verifyResponse = await fetch(verifyUrl, {
        headers: { Accept: "application/json" },
      });

      if (!verifyResponse.ok) {
        throw new Error(`HTTP ${verifyResponse.status}`);
      }

      const result = await verifyResponse.json();     

      if (result.status === "paid") {
        verificationInProgress.current = false;
        Toast.hide();

        Toast.show({
          type: "success",
          text1: "Successful Payment!",
          text2: `You win ${result.pointsEarned || 0} points 🎉`,
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          clearCart();
          
          // Obtener el nombre de la ruta desde la navegación
          const routes = navigation.getState?.()?.routes || [];         
          
          // Intentar diferentes métodos de navegación
          try {
            // Primero intentar con replace
            navigation.replace("OrderConfirmationScreen", {
              orderNumber: result.orderNumber,
              points: result.pointsEarned || 0,
              total: result.total || amount,
            });
          } catch (err) {      
            try {
              navigation.navigate("OrderConfirmationScreen", {
                orderNumber: result.orderNumber,
                points: result.pointsEarned || 0,
                total: result.total || amount,
              });
            } catch (err2) {              
              try {
                // Tal vez el nombre sea sin "Screen"
                navigation.navigate("OrderConfirmation", {
                  orderNumber: result.orderNumber,
                  points: result.pointsEarned || 0,
                  total: result.total || amount,
                });
              } catch (err3) {          
                // Mostrar alerta con la info
                Alert.alert(
                  "Successful Payment!",
                  `Order: ${result.orderNumber}\nTotal: ${result.total}\nPoints: ${result.pointsEarned}`,
                  [{ text: "OK", onPress: () => navigation.goBack() }]
                );
              }
            }
          }
        }, 800);
        return;
      }

      // Reintentar si está pendiente
      if (retryCount < 8) {
        verificationInProgress.current = false;
        setTimeout(() => verifyPayment(retryCount + 1), 2000);
      } else {
        verificationInProgress.current = false;
        Toast.hide();
        Toast.show({
          type: "info",
          text1: "Pending verification",
          text2: "Your payment is being processed",
          position: "top",
          visibilityTime: 4000,
        });
        setTimeout(() => navigation.goBack(), 3000);
      }
    } catch (err) {      
      verificationInProgress.current = false;

      if (retryCount < 8) {
        setTimeout(() => verifyPayment(retryCount + 1), 2000);
      } else {
        Toast.hide();
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Payment could not be verified",
          position: "top",
          visibilityTime: 4000,
        });
        setTimeout(() => navigation.goBack(), 3000);
      }
    }
  };

  // ===========================
  // 🔹 INTERCEPTAR REDIRECCIÓN - CLAVE
  // ===========================
  const handleNavigationStateChange = (navState) => {
    const { url } = navState;    

    // ✅ INTERCEPTAR cuando intente ir a order-confirmation
    if (url.includes("order-confirmation") && !paymentCompleted && referenceId) {

      setPaymentCompleted(true);

      Toast.show({
        type: "info",
        text1: "Proccesing payment",
        text2: "One momnent please...",
        position: "top",
        autoHide: false,
      });

      // Iniciar verificación
      setTimeout(() => {
        verifyPayment(0);
      }, 1500);

      // ❌ NO dejar que cargue la página web
      // El WebView NO debe navegar más
      return false; 
    }
  };

  // ===========================
  // 🔹 Bloquear carga de order-confirmation
  // ===========================
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    // ✅ Bloquear navegación a order-confirmation
    if (url.includes("order-confirmation")) {    
      
      if (!paymentCompleted && referenceId) {
        setPaymentCompleted(true);
        
        Toast.show({
          type: "info",
          text1: "Processing Payment",
          text2: "One moment please...",
          position: "top",
          autoHide: false,
        });

        setTimeout(() => {
          verifyPayment(0);
        }, 1500);
      }
      
      return false; // ❌ NO cargar esta URL
    }

    return true; // ✅ Permitir otras URLs
  };

  // ===========================
  // 🔹 Loading y errores
  // ===========================
  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Conectando con Authorize.Net...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );

  // ===========================
  // 🔹 WebView (móvil)
  // ===========================
  if (Platform.OS !== "web") {
    const paymentFormHtml = `
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()"
        style="background:#000;display:flex;align-items:center;justify-content:center;height:100vh;color:white;">
        <form method="post" action="https://test.authorize.net/payment/payment">
          <input type="hidden" name="token" value="${token}" />
          <p>Redirigiendo a Authorize.Net...</p>
        </form>
      </body>
      </html>
    `;

    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ html: paymentFormHtml }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFA500" />
            </View>
          )}
          style={{ flex: 1, backgroundColor: "#000" }}
        />
        <Toast />
      </View>
    );
  }

  // ===========================
  // 🔹 Vista Web
  // ===========================
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Redirigiendo a Authorize.Net...</h2>
      <p>Por favor espera un momento...</p>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, fontSize: 16 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});