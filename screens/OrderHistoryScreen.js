import { Feather as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../constants/supabase";

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchOrders = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error al obtener usuario:", userError);
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("Orders")
      .select(
        `
        *,
        Products:productid(Name)
      `
      )
      .eq("userid", user.id)
      .order("date", { ascending: false });

    console.log("Datos recibidos:", data);

    if (error) {
      console.error("Error al cargar pedidos:", error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrder = ({ item: order }) => (
    <View
      style={{
        backgroundColor: "white",
        marginBottom: 10,
        padding: 16,
        borderRadius: 10,
        elevation: 3,
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>
        <Icon.FileText width={18} height={18} color="#000" />{" "}
        {order.ordernumber}
      </Text>
      <Text style={{ color: "gray", marginBottom: 4 }}>
        Fecha: {new Date(order.date).toLocaleString()}
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 2 }}>
        Producto: {order.Products?.Name || "Desconocido"}
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 2 }}>
        Cantidad: {order.quantity}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>
        Total: ${order.price.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: "#F3F4F6" }}>
      {/* Botón volver */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginBottom: 10 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Icon.ChevronLeft width={22} height={22} color="#000" />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Back</Text>
        </View>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Order History
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFA500" />
      ) : orders.length === 0 ? (
        <Text>You have no orders registered.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
