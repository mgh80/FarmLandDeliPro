import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
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
        text2: "Complete all required fields",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Failed registration",
        text2: error.message,
      });
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "User ID not obtained",
      });
      return;
    }

    const { error: upsertError } = await supabase.from("Users").upsert({
      id: userId,
      email,
      name,
      phone,
      points: 0,
      dateCreated: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("🛑 Error saving to Users table:", upsertError);

      Toast.show({
        type: "error",
        text1: "Error saving to Users table",
        text2: upsertError.message,
      });
    } else {
      Toast.show({
        type: "success",
        text1: "User successfully registered",
        text2: "Verify your email before logging in",
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Phone"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleRegister}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create</Text>
        )}
      </Pressable>

      <Text style={styles.loginText}>
        Do you have account?{" "}
        <Text style={styles.loginLink} onPress={() => navigation.goBack()}>
          Login
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: {
    fontSize: 24,
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
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loginText: { marginTop: 15, color: "#666" },
  loginLink: { color: "#ff6347", fontWeight: "bold" },
});

export default RegisterScreen;
