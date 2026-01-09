import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
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

// Importante: esto permite que el navegador se cierre después del OAuth
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

 /* ===============================
   GUARDAR USUARIO EN LA TABLA USERS - CORREGIDO
=============================== */
const saveUserToDatabase = async (user) => {
  try {
    console.log("🔍 Attempting to save user:", user.id);
    
    // ✅ FIX 1: Cambiar "users" a "Users" (mayúscula)
    // ✅ FIX 2: Primero verificar si el usuario existe
    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("❌ Error checking user:", checkError);
    }

    const userData = {
      id: user.id,
      email: user.email,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0]      
    };

    // Si el usuario existe, actualizarlo. Si no, insertarlo.
    if (existingUser) {
      console.log("📝 Updating existing user...");
      const { data, error } = await supabase
        .from("Users")
        .update({
          email: userData.email,
          fullname: userData.fullname,
          profilepicture: userData.profilepicture,
        })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("❌ Error updating user:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("✅ User updated successfully:", data);
      }
    } else {
      console.log("➕ Inserting new user...");
      const { data, error } = await supabase
        .from("Users")
        .insert({
          id: userData.id,
          email: userData.email,
          fullname: userData.fullname,
          profilepicture: userData.profilepicture,
          dateCreated: new Date().toISOString(),
          points: 0,
        })
        .select();

      if (error) {
        console.error("❌ Error inserting user:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("✅ User inserted successfully:", data);
      }
    }
  } catch (error) {
    console.error("❌ Exception saving user:", error);
  }
};

  /* ===============================
     CONFIGURAR DEEP LINKING
  =============================== */
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;

      // Verificar si es un callback de OAuth
      if (
        url &&
        (url.includes("#access_token=") || url.includes("?access_token="))
      ) {
        try {
          setIsGoogleLoading(true);

          // Extraer los parámetros del URL
          const params = parseUrlParams(url);

          if (params.access_token && params.refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (error) throw error;

            console.log("✅ Session set via deep link");

            const userName =
              data.user?.user_metadata?.full_name ||
              data.user?.user_metadata?.name ||
              data.user?.email?.split("@")[0] ||
              "there";

            Toast.show({
              type: "success",
              text1: `Welcome, ${userName}! 🎉`,
              text2: "Signed in with Google successfully",
              visibilityTime: 3000,
              topOffset: 60,
            });

            // Guardar usuario en la base de datos (sin await para no bloquear)
            if (data.user) {
              saveUserToDatabase(data.user).catch(err => 
                console.error("Error in saveUserToDatabase:", err)
              );
            }

            setTimeout(() => {
              setIsGoogleLoading(false);
              navigation.replace("Home");
            }, 1000);
          }
        } catch (error) {
          setIsGoogleLoading(false);

          Toast.show({
            type: "error",
            text1: "Login failed",
            text2: error.message || "Something went wrong",
            visibilityTime: 4000,
            topOffset: 60,
          });
        }
      }
    };

    // Suscribirse a eventos de deep linking
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Verificar si la app se abrió con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  /* ===============================
     HELPER: PARSEAR URL PARAMS
  =============================== */
  const parseUrlParams = (url) => {
    const params = {};

    // Manejar tanto hash (#) como query (?)
    let paramString = "";

    if (url.includes("#")) {
      paramString = url.split("#")[1];
    } else if (url.includes("?")) {
      paramString = url.split("?")[1];
    }

    if (paramString) {
      paramString.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    return params;
  };

  /* ===============================
     VERIFICAR SESIÓN AL INICIAR
  =============================== */
  useEffect(() => {
    checkExistingSession();

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔔 Auth event:", event);
        
        if (event === "SIGNED_IN" && session) {
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

          // Guardar usuario en la base de datos (sin await para no bloquear)
          saveUserToDatabase(session.user).catch(err => 
            console.error("Error in saveUserToDatabase:", err)
          );

          setTimeout(() => navigation.replace("Home"), 1000);
        } else if (event === "SIGNED_OUT") {
          setIsCheckingSession(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigation]);

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
        console.error("Error getting session:", error);
        setIsCheckingSession(false);
        return;
      }

      if (session) {
        console.log("✅ Existing session found");

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

        // Guardar usuario en la base de datos (sin await para no bloquear)
        saveUserToDatabase(session.user).catch(err => 
          console.error("Error in saveUserToDatabase:", err)
        );

        setTimeout(() => navigation.replace("Home"), 800);
      } else {
        setIsCheckingSession(false);
      }
    } catch (err) {
      console.error("Exception in checkExistingSession:", err);
      setIsCheckingSession(false);
    }
  };

  /* ===============================
     GOOGLE SIGN IN - VERSIÓN MEJORADA
  =============================== */
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // Crear el redirect URL usando tu scheme personalizado
      const redirectUrl = "farmlanddeli://";

      // Iniciar el flujo OAuth con Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Abrir el navegador para OAuth
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
          }
        );

        // Si el resultado trae URL, procesarla directamente
        if (result.type === "success" && result.url) {
          // Procesar el URL manualmente si contiene tokens
          if (
            result.url.includes("#access_token=") ||
            result.url.includes("?access_token=")
          ) {
            const params = parseUrlParams(result.url);

            if (params.access_token && params.refresh_token) {
              const { data: sessionData, error: sessionError } =
                await supabase.auth.setSession({
                  access_token: params.access_token,
                  refresh_token: params.refresh_token,
                });

              if (sessionError) throw sessionError;

              console.log("✅ Session set successfully");

              const userName =
                sessionData.user?.user_metadata?.full_name ||
                sessionData.user?.user_metadata?.name ||
                sessionData.user?.email?.split("@")[0] ||
                "there";

              Toast.show({
                type: "success",
                text1: `Welcome, ${userName}! 🎉`,
                text2: "Signed in with Google successfully",
                visibilityTime: 3000,
                topOffset: 60,
              });

              // Guardar usuario en la base de datos (sin await para no bloquear)
              if (sessionData.user) {
                saveUserToDatabase(sessionData.user).catch(err => 
                  console.error("Error in saveUserToDatabase:", err)
                );
              }

              setTimeout(() => {
                setIsGoogleLoading(false);
                navigation.replace("Home");
              }, 1000);
            }
          }
        } else if (result.type === "cancel") {
          setIsGoogleLoading(false);
          Toast.show({
            type: "info",
            text1: "Login cancelled",
            text2: "You cancelled the Google sign-in",
            visibilityTime: 3000,
            topOffset: 60,
          });
        } else if (result.type === "dismiss") {
          setIsGoogleLoading(false);
          Toast.show({
            type: "info",
            text1: "Login dismissed",
            text2: "Browser was closed",
            visibilityTime: 3000,
            topOffset: 60,
          });
        }
      }
    } catch (error) {
      setIsGoogleLoading(false);

      Toast.show({
        type: "error",
        text1: "Google Sign-In failed",
        text2: error.message || "Please try again",
        visibilityTime: 4000,
        topOffset: 60,
      });
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

      console.log("✅ Login successful");

      // Guardar usuario en la base de datos (sin await para no bloquear)
      if (data.user) {
        saveUserToDatabase(data.user).catch(err => 
          console.error("Error in saveUserToDatabase:", err)
        );
      }
    } catch (err) {
      let errorMessage = err.message;

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
     CONTINUE AS GUEST
  =============================== */
  const handleContinueAsGuest = () => {
    Toast.show({
      type: "info",
      text1: "Welcome, Guest! 👋",
      text2: "You'll need to log in to place orders",
      visibilityTime: 3000,
      topOffset: 60,
    });

    setTimeout(() => navigation.replace("Home"), 800);
  };

  /* ===============================
     LOADING STATE
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

            {/* EMAIL INPUT */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading && !isGoogleLoading}
            />

            {/* PASSWORD INPUT */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading && !isGoogleLoading}
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

            {/* LOGIN BUTTON */}
            <Pressable
              style={[
                styles.button,
                (isLoading || isGoogleLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            {/* SIGN UP LINK */}
            <Pressable
              onPress={() =>
                !isLoading &&
                !isGoogleLoading &&
                navigation.navigate("Register")
              }
              style={{ marginTop: 15 }}
              disabled={isLoading || isGoogleLoading}
            >
              <Text
                style={[
                  styles.link,
                  (isLoading || isGoogleLoading) && styles.linkDisabled,
                ]}
              >
                Don't have an account? Sign up
              </Text>
            </Pressable>

            {/* DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* BOTÓN DE GOOGLE SIGN IN */}
            <Pressable
              style={[
                styles.googleButton,
                isGoogleLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#666" />
              ) : (
                <>
                  <Image
                    source={{
                      uri: "https://www.google.com/favicon.ico",
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* GUEST OPTION */}

            <Pressable
              style={[
                styles.guestButton,
                (isLoading || isGoogleLoading) && styles.buttonDisabled,
              ]}
              onPress={handleContinueAsGuest}
              disabled={isLoading || isGoogleLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
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
  googleButton: {
    width: "90%",
    height: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
    fontWeight: "bold",
  },
  guestButton: {
    width: "90%",
    height: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ff6347",
  },
  guestButtonText: {
    color: "#ff6347",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;