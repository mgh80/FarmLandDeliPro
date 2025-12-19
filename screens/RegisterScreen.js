import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../constants/supabase";

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Toast.show({
        type: "error",
        text1: "Incomplete fields",
        text2: "Please complete all required fields",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("User ID not obtained");

      const { error: upsertError } = await supabase.from("Users").upsert({
        id: userId,
        email,
        name,
        phone,
        points: 0,
        dateCreated: new Date().toISOString(),
      });

      if (upsertError) throw upsertError;

      Toast.show({
        type: "success",
        text1: "Account created",
        text2: "Please verify your email before logging in",
      });

      navigation.replace("Login");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              source={require("../assets/images/splash.png")}
              style={styles.logo}
            />

            <Text style={styles.title}>Create Account</Text>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Phone"
              placeholderTextColor="#999"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              style={{ marginTop: 15 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginLink}>
                Already have an account? Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

/* ===============================
   STYLES
=============================== */
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000", // 🔥 CLAVE para que se vea el texto
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    color: "#ff6347",
    fontWeight: "bold",
  },
});

export default RegisterScreen;
