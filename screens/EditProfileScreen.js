import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Icon from "react-native-feather";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { supabase } from "../constants/supabase";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No user found",
          visibilityTime: 3000,
          topOffset: 60,
        });
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from("Users")
        .select("name, email, phone")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load profile data",
          visibilityTime: 3000,
          topOffset: 60,
        });
      } else if (data) {
        setUserData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!userData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Name is required",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    if (!userData.email.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Email is required",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a valid email",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    // Validar teléfono (opcional, pero si se ingresa debe ser válido)
    if (userData.phone && userData.phone.length < 10) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Phone number must be at least 10 digits",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Session expired",
          visibilityTime: 3000,
          topOffset: 60,
        });
        navigation.replace("Login");
        return;
      }

      // Actualizar datos en la tabla Users
      const { error: updateError } = await supabase
        .from("Users")
        .update({
          name: userData.name.trim(),
          email: userData.email.trim(),
          phone: userData.phone.trim() || null,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: updateError.message || "Failed to update profile",
          visibilityTime: 3000,
          topOffset: 60,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Success! ✅",
        text2: "Profile updated successfully",
        visibilityTime: 2000,
        topOffset: 60,
      });

      // Volver a la pantalla anterior después de 1 segundo
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error("Unexpected error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={{ marginTop: 10, color: "#6b7280" }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
              marginRight: 12,
            }}
          >
            <Icon.ArrowLeft width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>
            Edit Profile
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Name *
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Icon.User width={20} height={20} stroke="#6b7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#1F2937",
                }}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                value={userData.name}
                onChangeText={(text) =>
                  setUserData({ ...userData, name: text })
                }
              />
            </View>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Email *
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Icon.Mail width={20} height={20} stroke="#6b7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#1F2937",
                }}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={userData.email}
                onChangeText={(text) =>
                  setUserData({ ...userData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Teléfono */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Phone (Optional)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Icon.Phone width={20} height={20} stroke="#6b7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#1F2937",
                }}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                value={userData.phone}
                onChangeText={(text) =>
                  setUserData({ ...userData, phone: text })
                }
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Nota informativa */}
          <View
            style={{
              backgroundColor: "#eff6ff",
              borderRadius: 12,
              padding: 16,
              marginTop: 10,
              borderLeftWidth: 4,
              borderLeftColor: "#3b82f6",
            }}
          >
            <Text style={{ fontSize: 14, color: "#1e40af" }}>
              ℹ️ Your profile information helps us provide better service and
              keep you updated on your orders.
            </Text>
          </View>
        </ScrollView>

        {/* Botón de guardar */}
        <View
          style={{
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            backgroundColor: "white",
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? "#FCA5A5" : "#FF6A4D",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            {saving ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Icon.Save width={20} height={20} stroke="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
