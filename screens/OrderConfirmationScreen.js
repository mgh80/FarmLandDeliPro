import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../constants/supabase";

const TIMER_KEY = "order_timer_start";
const ORDER_INFO_KEY = "order_info";

export default function OrderConfirmationScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const [totalPoints, setTotalPoints] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loadingTimer, setLoadingTimer] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(false);

  // Limpiar temporizador y datos de orden al desmontar
  useEffect(() => {
    return () => {
      AsyncStorage.removeItem(TIMER_KEY);
      AsyncStorage.removeItem(ORDER_INFO_KEY);
    };
  }, []);

  // ✅ NUEVO: Sumar y traer los puntos del usuario en un solo paso
  useEffect(() => {
    const processAndFetchUserPoints = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) return;

        // 1. Obtener los puntos que tiene el usuario actualmente
        const { data: userData, error: fetchError } = await supabase
          .from("Users")
          .select("points")
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;

        let currentPoints = userData?.points || 0;

        // 2. Si hay puntos ganados en esta orden, sumarlos a la base de datos
        if (params?.points && params.points > 0) {
          const earnedPoints = Math.floor(params.points);
          const newTotal = currentPoints + earnedPoints;

          const { error: updateError } = await supabase
            .from("Users")
            .update({ points: newTotal })
            .eq("id", user.id);

          if (!updateError) {
            currentPoints = newTotal; // Actualizamos para la vista
          } else {
            console.error("Error sumando puntos:", updateError);
          }
        }

        // 3. Mostrar el total en pantalla
        setTotalPoints(currentPoints);
      } catch (err) {
        console.error("Error en el proceso de puntos:", err);
      }
    };

    processAndFetchUserPoints();
  }, [params?.points]);

  // Temporizador original (15 minutos)
  useEffect(() => {
    let interval;
    const initTimer = async () => {
      const savedStartTime = await AsyncStorage.getItem(TIMER_KEY);
      let startTime = savedStartTime ? parseInt(savedStartTime) : null;

      if (!startTime) {
        startTime = Date.now();
        await AsyncStorage.setItem(TIMER_KEY, startTime.toString());
      }

      const updateTimeLeft = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = 900 - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      };

      updateTimeLeft();
      setLoadingTimer(false);

      interval = setInterval(() => {
        if (!isReady && !isCanceled) updateTimeLeft();
      }, 1000);

      return () => clearInterval(interval);
    };

    initTimer();

    return () => clearInterval(interval);
  }, [isReady, isCanceled]);

  // Polling para ver si la orden ya fue marcada como lista o cancelada
  useEffect(() => {
    let polling;
    const fetchOrderStatus = async () => {
      if (!params?.orderNumber) return;
      const { data, error } = await supabase
        .from("Orders")
        .select("orderstatus, cancelstatus")
        .eq("ordernumber", params.orderNumber)
        .single();

      if (!error && data) {
        if (data.cancelstatus === true) {
          setIsCanceled(true);
          setTimeLeft(0);
        } else if (data.orderstatus === true) {
          setIsReady(true);
          setTimeLeft(0);
        } else {
          setIsReady(false);
          setIsCanceled(false);
        }
      }
    };

    polling = setInterval(fetchOrderStatus, 4000);
    fetchOrderStatus();

    return () => clearInterval(polling);
  }, [params?.orderNumber]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "No, keep order", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: confirmCancelOrder,
        },
      ],
    );
  };

  const confirmCancelOrder = async () => {
    try {
      setCancelingOrder(true);

      const { error: updateError } = await supabase
        .from("Orders")
        .update({ cancelstatus: true })
        .eq("ordernumber", params?.orderNumber);

      if (updateError) {
        Alert.alert("Error", "Failed to cancel order. Please try again.");
        setCancelingOrder(false);
        return;
      }

      // Restar los puntos que se habían sumado
      if (params?.points && params?.points > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("Users")
            .select("points")
            .eq("id", user.id)
            .single();

          if (userData) {
            const newPoints = Math.max(0, userData.points - params.points);
            await supabase
              .from("Users")
              .update({ points: newPoints })
              .eq("id", user.id);
            setTotalPoints(newPoints);
          }
        }
      }

      setIsCanceled(true);
      setTimeLeft(0);
      setCancelingOrder(false);

      Alert.alert(
        "Order Canceled",
        "Your order has been canceled successfully.",
        [{ text: "OK", onPress: handleGoHome }],
      );
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      setCancelingOrder(false);
    }
  };

  const handleGoHome = async () => {
    await AsyncStorage.removeItem(TIMER_KEY);
    await AsyncStorage.removeItem(ORDER_INFO_KEY);
    navigation.replace("Home");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
      }}
    >
      {isCanceled ? (
        <View
          style={{
            width: 120,
            height: 120,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
            backgroundColor: "#FFEBEE",
            borderRadius: 60,
          }}
        >
          <Text style={{ fontSize: 70 }}>❌</Text>
        </View>
      ) : (
        <Image
          source={require("../assets/images/success.png")}
          style={{ width: 120, height: 120, marginBottom: 20 }}
        />
      )}

      {isCanceled ? (
        <>
          <Text style={{ fontSize: 26, fontWeight: "bold", color: "#F44336" }}>
            Order Canceled
          </Text>
          <Text style={{ fontSize: 16, marginTop: 10, textAlign: "center" }}>
            Your order #{params?.orderNumber} has been canceled.
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 26, fontWeight: "bold", color: "#4CAF50" }}>
            ¡Successful order!
          </Text>
          <Text style={{ fontSize: 16, marginTop: 10 }}>
            Your order number is:
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#333",
              marginBottom: 10,
            }}
          >
            {params?.orderNumber}
          </Text>

          <Text style={{ fontSize: 16, marginVertical: 6 }}>
            🎁 You earned{" "}
            <Text style={{ fontWeight: "bold" }}>{params?.points}</Text> point
            {params?.points === 1 ? "" : "s"} in this order.
          </Text>

          {totalPoints === null ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              🧮 Total points accumulated:{" "}
              <Text style={{ fontWeight: "bold", color: "#4CAF50" }}>
                {totalPoints}
              </Text>
            </Text>
          )}

          {loadingTimer ? (
            <ActivityIndicator size="large" color="#FFA500" />
          ) : isReady || timeLeft <= 0 ? (
            <Text style={{ fontSize: 20, marginTop: 20, color: "#FF5722" }}>
              ✅ Your order is ready for pickup
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 36,
                color: "#FFA500",
                fontWeight: "bold",
                marginTop: 20,
              }}
            >
              ⏳ {formatTime(timeLeft)}
            </Text>
          )}
        </>
      )}

      <View style={{ marginTop: 30, width: "100%" }}>
        {!isReady && !isCanceled && (
          <TouchableOpacity
            onPress={handleCancelOrder}
            disabled={cancelingOrder}
            style={{
              backgroundColor: "#F44336",
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              opacity: cancelingOrder ? 0.6 : 1,
            }}
          >
            {cancelingOrder ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Cancel Order
              </Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleGoHome}
          style={{ backgroundColor: "#FFA500", padding: 15, borderRadius: 10 }}
        >
          <Text
            style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
          >
            Go to home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
