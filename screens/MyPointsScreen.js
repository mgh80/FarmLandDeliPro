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
  const [errorMsg, setErrorMsg] = useState(null);
  const navigation = useNavigation();

  const fetchPoints = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {     
      setErrorMsg("Unable to load points.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("Users")
      .select("points")
      .eq("id", user.id)
      .single();

    if (error) {      
      setErrorMsg("Unable to retrieve your points.");
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
      {/* 🔙 Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="chevron-left" size={26} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* ⭐ Points Card */}
      <View style={styles.card}>
        <Text style={styles.title}>🎯 My Points</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFA500" />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <Text style={styles.points}>{points} pts</Text>
        )}

        <Text style={styles.infoText}>
          Collect points with every purchase and redeem them for exclusive
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
    marginBottom: 10,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 6,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 10,
    alignItems: "center",

    // Shadow
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FF6B00",
  },
  points: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    maxWidth: "85%",
    lineHeight: 20,
  },
});
