import { Feather as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../constants/supabase";

export default function MyPointsScreen() {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchPoints = async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error al obtener usuario:", userError);
      setPoints(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("Users")
      .select("points")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error al obtener puntos:", error.message);
      setPoints(null);
    } else {
      setPoints(data?.points || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón Volver */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon.ChevronLeft width={24} height={24} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>🎯 My Points</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFA500" />
        ) : (
          <Text style={styles.points}>{points} pts</Text>
        )}

        <Text style={styles.infoText}>
          ¡Collect points for each purchase and redeem them for exclusive
          rewards!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FF6B00",
  },
  points: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});
