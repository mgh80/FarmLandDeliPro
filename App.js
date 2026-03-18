import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { CartProvider } from "./context/CartContext";
import Navigation from "./navigation";
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
      Notifications.addNotificationReceivedListener((notification) => {});

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
