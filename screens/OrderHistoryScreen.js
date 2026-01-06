import { Feather as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
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

    if (error) {     
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
    <View style={styles.card}>
      <View style={styles.row}>
        <Icon name="file-text" size={18} color="#FF6B00" />
        <Text style={styles.orderNumber}>{order.ordernumber}</Text>
      </View>

      <Text style={styles.dateText}>
        {new Date(order.date).toLocaleString()}
      </Text>

      <Text style={styles.itemText}>
        <Text style={styles.bold}>Product: </Text>
        {order.Products?.Name || "Unknown"}
      </Text>

      <Text style={styles.itemText}>
        <Text style={styles.bold}>Quantity: </Text>
        {order.quantity}
      </Text>

      <Text style={styles.totalText}>Total: ${order.price.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="chevron-left" size={22} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Order History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFA500" />
      ) : orders.length === 0 ? (
        <Text style={styles.noOrdersText}>You have no orders yet.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#FF6B00",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,

    // sombra
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  dateText: {
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 15,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "600",
  },
  totalText: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
    color: "#111",
  },
  noOrdersText: {
    fontSize: 16,
    color: "#555",
    marginTop: 20,
  },
});
