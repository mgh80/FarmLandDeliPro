import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

  const saveUserToSupabase = async (user) => {
    try {
      const { data: existingUsers, error: fetchError } = await supabase
        .from("Users")
        .select("id, name")
        .eq("id", user.id)
        .limit(1);

      if (fetchError) {
        Toast.show({
          type: "error",
          text1: "Error consultando usuario",
          text2: fetchError.message,
        });
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        const userName = existingUsers[0].name || "user";
        Toast.show({
          type: "success",
          text1: `Welcome, ${userName}!`,
          text2: "Successful login 👋",
        });
        setTimeout(() => {
          navigation.replace("Home");
        }, 1000);
        return;
      }

      const upsertPayload = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "",
        phone: user.phone || "",
      };

      const { error: upsertError } = await supabase
        .from("Users")
        .upsert(upsertPayload);

      if (upsertError) {
        Toast.show({
          type: "error",
          text1: "Error saving user",
          text2: upsertError.message,
        });
      } else {
        const newUserName = upsertPayload.name || "user";
        Toast.show({
          type: "success",
          text1: `Welcome, ${newUserName}!`,
          text2: "Successful registration 🎉",
        });
        setTimeout(() => {
          navigation.replace("Home");
        }, 1000);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Unexpected error",
        text2: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      const redirectUri =
        Platform.OS === "web"
          ? "https://farm-land-deli-app.vercel.app"
          : AuthSession.makeRedirectUri({
              path: "auth",
            });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        Toast.show({
          type: "error",
          text1: "Google Login Failed",
          text2: error.message,
        });
      } else {
        console.log("Google OAuth started:", data);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Unexpected error",
        text2: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "All fields are required",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error logging in",
          text2: error.message,
        });
        return;
      }

      await saveUserToSupabase(data.user);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Unexpected error",
        text2: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          await saveUserToSupabase(data.session.user);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await saveUserToSupabase(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
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
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
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
        onPress={handleEmailPasswordLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Text style={styles.registerText}>
        Don’t have an account?{" "}
        <Text
          style={[styles.registerLink, isLoading && styles.linkDisabled]}
          onPress={() => !isLoading && navigation.navigate("Register")}
        >
          Sign up
        </Text>
      </Text>

      <Pressable
        style={[styles.googleButton, isLoading && styles.buttonDisabled]}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <Image
          source={require("../assets/images/google.png")}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>
          {isLoading ? "Connecting..." : "Sign in with Google"}
        </Text>
      </Pressable>
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
  logo: { width: 200, height: 200, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: {
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
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
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    color: "#000",
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
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  registerText: { marginTop: 15, color: "#666" },
  registerLink: { color: "#ff6347", fontWeight: "bold" },
  linkDisabled: { color: "#ccc" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    minWidth: "90%",
    justifyContent: "center",
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 16, color: "#333" },
});

export default LoginScreen;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   Pressable,
//   Image,
//   StyleSheet,
//   TextInput,
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { supabase } from "../constants/supabase";
// import Toast from "react-native-toast-message";
// import * as AuthSession from "expo-auth-session";
// import Icon from "react-native-vector-icons/Feather";

// const LoginScreen = () => {
//   const navigation = useNavigation();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const saveUserToSupabase = async (user) => {
//     try {
//       const { data: existingUsers, error: fetchError } = await supabase
//         .from("Users")
//         .select("id, name")
//         .eq("id", user.id)
//         .limit(1);

//       if (fetchError) {
//         Toast.show({
//           type: "error",
//           text1: "Error consultando usuario",
//           text2: fetchError.message,
//         });
//         return;
//       }

//       if (existingUsers && existingUsers.length > 0) {
//         const userName = existingUsers[0].name || "user";
//         Toast.show({
//           type: "success",
//           text1: `Welcome, ${userName}!`,
//           text2: "Successful login 👋",
//         });
//         setTimeout(() => {
//           navigation.replace("Home");
//         }, 1000);
//         return;
//       }

//       const upsertPayload = {
//         id: user.id,
//         email: user.email,
//         name: user.user_metadata?.full_name || "",
//         phone: user.phone || "",
//       };

//       const { error: upsertError } = await supabase
//         .from("Users")
//         .upsert(upsertPayload);

//       if (upsertError) {
//         Toast.show({
//           type: "error",
//           text1: "Error saving user",
//           text2: upsertError.message,
//         });
//       } else {
//         const newUserName = upsertPayload.name || "user";
//         Toast.show({
//           type: "success",
//           text1: `Welcome, ${newUserName}!`,
//           text2: "Successful registration 🎉",
//         });
//         setTimeout(() => {
//           navigation.replace("Home");
//         }, 1000);
//       }
//     } catch (err) {
//       Toast.show({
//         type: "error",
//         text1: "Unexpected error",
//         text2: err.message,
//       });
//     }
//   };

//   const handleGoogleLogin = async () => {
//     const redirectUri = "https://farmlanddeli.vercel.app";

//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: redirectUri,
//         queryParams: { prompt: "select_account" },
//       },
//     });

//     if (error) {
//       Toast.show({
//         type: "error",
//         text1: "Google Login Failed",
//         text2: error.message,
//       });
//     }
//   };

//   const handleEmailPasswordLogin = async () => {
//     if (!email || !password) {
//       Toast.show({
//         type: "error",
//         text1: "All fields are required",
//       });
//       return;
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       Toast.show({
//         type: "error",
//         text1: "Error logging in",
//         text2: error.message,
//       });
//       return;
//     }

//     await saveUserToSupabase(data.user);
//   };

//   useEffect(() => {
//     const checkSession = async () => {
//       const { data } = await supabase.auth.getSession();
//       if (data?.session?.user) {
//         await saveUserToSupabase(data.session.user);
//       }
//     };

//     checkSession();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (event === "SIGNED_IN" && session?.user) {
//           await saveUserToSupabase(session.user);
//         }
//       }
//     );

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Image
//         source={require("../assets/images/splash.png")}
//         style={styles.logo}
//       />
//       <Text style={styles.title}>Hello!</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor="#999"
//         value={email}
//         onChangeText={setEmail}
//       />

//       <View style={styles.passwordContainer}>
//         <TextInput
//           style={styles.passwordInput}
//           placeholder="Password"
//           secureTextEntry={!showPassword}
//           placeholderTextColor="#999"
//           value={password}
//           onChangeText={setPassword}
//         />
//         <Pressable onPress={() => setShowPassword(!showPassword)}>
//           <Icon
//             name={showPassword ? "eye-off" : "eye"}
//             size={20}
//             color="#999"
//           />
//         </Pressable>
//       </View>

//       <Pressable style={styles.button} onPress={handleEmailPasswordLogin}>
//         <Text style={styles.buttonText}>Login</Text>
//       </Pressable>

//       <Text style={styles.registerText}>
//         Don’t have an account?{" "}
//         <Text
//           style={styles.registerLink}
//           onPress={() => navigation.navigate("Register")}
//         >
//           Sign up
//         </Text>
//       </Text>

//       <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
//         <Image
//           source={require("../assets/images/google.png")}
//           style={styles.googleIcon}
//         />
//         <Text style={styles.googleButtonText}>Sign in with Google</Text>
//       </Pressable>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f7f7f7",
//     padding: 20,
//   },
//   logo: { width: 200, height: 200, marginBottom: 20 },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
//   input: {
//     width: "90%",
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     backgroundColor: "#f9f9f9",
//   },
//   passwordContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     width: "90%",
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     backgroundColor: "#f9f9f9",
//   },
//   passwordInput: {
//     flex: 1,
//     color: "#000",
//   },
//   button: {
//     width: "90%",
//     height: 50,
//     backgroundColor: "#ff6347",
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 10,
//     marginTop: 10,
//   },
//   buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   registerText: { marginTop: 15, color: "#666" },
//   registerLink: { color: "#ff6347", fontWeight: "bold" },
//   googleButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 20,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     backgroundColor: "#fff",
//   },
//   googleIcon: { width: 20, height: 20, marginRight: 10 },
//   googleButtonText: { fontSize: 16, color: "#333" },
// });

// export default LoginScreen;
