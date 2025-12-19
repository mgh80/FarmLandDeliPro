import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
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

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  /* ===============================
     VERIFICAR SESIÓN AL INICIAR
  =============================== */
  useEffect(() => {
    checkExistingSession();

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_IN" && session) {
          // Obtener nombre del usuario
          const userName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "there";

          Toast.show({
            type: "success",
            text1: `Welcome back, ${userName}! 👋`,
            text2: "Good to see you again",
            visibilityTime: 3000,
            topOffset: 60,
          });

          setTimeout(() => navigation.replace("Home"), 1000);
        } else if (event === "SIGNED_OUT") {
          // Usuario cerró sesión manualmente
          setIsCheckingSession(false);
        }
      }
    );

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /* ===============================
     VERIFICAR SI YA HAY SESIÓN ACTIVA
  =============================== */
  const checkExistingSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking session:", error);
        setIsCheckingSession(false);
        return;
      }

      if (session) {
        // Ya hay sesión activa, ir directo a Home
        console.log("Session found, redirecting to Home");

        const userName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "there";

        Toast.show({
          type: "success",
          text1: `Welcome back, ${userName}! 🎉`,
          text2: "You're already signed in",
          visibilityTime: 2000,
          topOffset: 60,
        });

        setTimeout(() => navigation.replace("Home"), 800);
      } else {
        // No hay sesión, mostrar pantalla de login
        setIsCheckingSession(false);
      }
    } catch (err) {
      console.error("Unexpected error checking session:", err);
      setIsCheckingSession(false);
    }
  };

  /* ===============================
     EMAIL / PASSWORD LOGIN
  =============================== */
  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Oops! Missing fields 🤔",
        text2: "Please enter your email and password",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      // La navegación y el toast se manejan en onAuthStateChange
      console.log("Login successful:", data.user.email);
    } catch (err) {
      let errorMessage = err.message;

      // Mensajes más amigables
      if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Wrong email or password";
      } else if (err.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email first";
      }

      Toast.show({
        type: "error",
        text1: "Login failed 😕",
        text2: errorMessage,
        visibilityTime: 4000,
        topOffset: 60,
      });
      setIsLoading(false);
    }
  };

  /* ===============================
     MOSTRAR LOADING MIENTRAS VERIFICA SESIÓN
  =============================== */
  if (isCheckingSession) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require("../assets/images/splash.png")}
          style={styles.logo}
        />
        <ActivityIndicator
          size="large"
          color="#ff6347"
          style={{ marginTop: 20 }}
        />
        <Text style={styles.loadingText}>Checking session...</Text>
      </View>
    );
  }

  /* ===============================
     UI - PANTALLA DE LOGIN
  =============================== */
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

            <Text style={styles.title}>Hello!</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#999"
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => !isLoading && navigation.navigate("Register")}
              style={{ marginTop: 15 }}
              disabled={isLoading}
            >
              <Text style={[styles.link, isLoading && styles.linkDisabled]}>
                Dont have an account? Sign up
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
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    color: "#ff6347",
    fontWeight: "bold",
  },
  linkDisabled: {
    color: "#ccc",
  },
});

export default LoginScreen;
