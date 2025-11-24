import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Navigation from "./navigation";
import Toast from "react-native-toast-message";
import { CartProvider } from "./context/CartContext";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import SplashScreen from "./screens/SplashScreen"; // 👈 Asegúrate que esta ruta sea correcta

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const [showSplash, setShowSplash] = useState(true); // 👈 Estado para mostrar splash

  useEffect(() => {
    // Listener de notificaciones
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notificación recibida:", notification);
      });

    // Temporizador para ocultar splash
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 segundos

    return () => {
      // 🔥 ESTA ES LA FORMA CORRECTA EN EXPO SDK 50+
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      clearTimeout(splashTimeout);
    };
  }, []);

  return (
    <CartProvider>
      <View style={{ flex: 1 }}>
        {showSplash ? <SplashScreen /> : <Navigation />}
        <Toast />
        <StatusBar style="auto" />
      </View>
    </CartProvider>
  );
}
