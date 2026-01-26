import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Icon from "react-native-feather";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Carousel from "../components/carousel";
import Categories from "../components/categories";
import FeaturedRow from "../components/featuredRow";
import RewardsSection from "../components/rewardsSection";
import { useCategories, useProducts } from "../constants";
import { supabase } from "../constants/supabase";
import { useCart } from "../context/CartContext";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getTotalItems, clearCart } = useCart();

  const [showSidebar, setShowSidebar] = useState(false);
  const [pressedIcon, setPressedIcon] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userName, setUserName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef(null);

  const products = useProducts();
  const categories = useCategories();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchUserName();

      Toast.show({
        type: "success",
        text1: "Refreshed! 🔄",
        text2: "Content updated",
        visibilityTime: 2000,
        topOffset: 60,
      });
    } catch (error) {
      console.error("Error refreshing:", error);
      Toast.show({
        type: "error",
        text1: "Refresh failed",
        text2: "Please try again",
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearCart();
    navigation.replace("Login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
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
        return;
      }

      const { error: updateError } = await supabase
        .from("Users")
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error marking user as deleted:", updateError);

        const { error: deleteError } = await supabase
          .from("Users")
          .delete()
          .eq("id", user.id);

        if (deleteError) {
          console.error("Error deleting user:", deleteError);

          if (deleteError.code === "23503") {
            Toast.show({
              type: "error",
              text1: "Cannot Delete Account",
              text2: "You have existing orders. Please contact support.",
              visibilityTime: 4000,
              topOffset: 60,
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to delete account",
              visibilityTime: 3000,
              topOffset: 60,
            });
          }
          return;
        }
      }

      await supabase.auth.signOut();
      clearCart();

      Toast.show({
        type: "success",
        text1: "Account Deleted",
        text2: "Your account has been deactivated",
        visibilityTime: 3000,
        topOffset: 60,
      });

      setTimeout(() => navigation.replace("Login"), 1000);
    } catch (error) {
      console.error("Unexpected error deleting account:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
        visibilityTime: 3000,
        topOffset: 60,
      });
    }
  };

  const fetchUserName = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsGuest(false);
      const { data } = await supabase
        .from("Users")
        .select("name")
        .eq("id", user.id)
        .single();

      if (data) setUserName(data.name);
    } else {
      setIsGuest(true);
      setUserName("Guest");
    }
  };

  useEffect(() => {
    fetchUserName();
  }, []);

  const handleCartPress = useCallback(() => {
    navigation.navigate("Cart");
  }, [navigation]);

  const handleHomePress = useCallback(() => {
    setSearchText("");
    setActiveCategory(null);

    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  }, []);

  const handleProfilePress = useCallback(() => {
    setShowSidebar(true);
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginTop: 10,
        }}
      >
        <Icon.User width={24} height={24} stroke="#4a90e2" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#4a90e2",
            marginLeft: 8,
          }}
        >
          Hello! {userName}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#e0f2fe",
            borderRadius: 25,
            paddingHorizontal: 15,
            paddingVertical: 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Icon.Search width={20} height={20} stroke="#3b82f6" />
          <TextInput
            placeholder="Search products"
            placeholderTextColor="#60a5fa"
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: "#1E3A8A",
            }}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== "" && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Icon.X width={20} height={20} stroke="#60a5fa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ marginTop: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4a90e2"]}
            tintColor="#4a90e2"
            title="Pull to refresh"
            titleColor="#999"
          />
        }
      >
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        <Carousel />
        {categories.map((cat) => {
          const productsInCategory = products.filter(
            (p) => p.CategoryId === cat.Id,
          );
          if (activeCategory && cat.Name !== activeCategory) return null;
          const filteredProducts = productsInCategory.filter((p) =>
            p.Name.toLowerCase().includes(searchText.toLowerCase()),
          );
          if (filteredProducts.length === 0) return null;
          return (
            <FeaturedRow
              key={cat.Id}
              title={cat.Name}
              description={`${filteredProducts.length} products`}
              products={filteredProducts}
            />
          );
        })}
        <RewardsSection />
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#fff",
        }}
      >
        <TouchableOpacity
          onPress={handleHomePress}
          activeOpacity={0.7}
          style={{ alignItems: "center" }}
        >
          <Icon.Home width={26} height={26} stroke="#1F2937" />
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: "#1F2937",
              fontWeight: "600",
            }}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCartPress}
          activeOpacity={0.7}
          style={{ position: "relative", alignItems: "center" }}
        >
          <Icon.ShoppingCart width={26} height={26} stroke="#6B7280" />
          {getTotalItems() > 0 && (
            <View
              style={{
                position: "absolute",
                right: -8,
                top: -4,
                backgroundColor: "#FFA500",
                borderRadius: 10,
                paddingHorizontal: 5,
                paddingVertical: 1,
                minWidth: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
              >
                {getTotalItems()}
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: "#6B7280",
              fontWeight: "400",
            }}
          >
            Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleProfilePress}
          activeOpacity={0.7}
          style={{ alignItems: "center" }}
        >
          <Icon.User width={24} height={24} stroke="#6B7280" />
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: "#6B7280",
              fontWeight: "400",
            }}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSidebar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSidebar(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            flexDirection: "row",
          }}
        >
          <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <View
            style={{
              width: "78%",
              height: "100%",
              backgroundColor: "white",
              paddingTop: 40,
              paddingHorizontal: 20,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: -2, height: 0 },
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 4 }}>
              Profile
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#4a90e2",
                marginBottom: 24,
              }}
            >
              {userName}
            </Text>

            {!isGuest && (
              <>
                {/* NUEVO: Edit Profile */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("EditProfile");
                  }}
                >
                  <Icon.Edit width={22} height={22} stroke="#1F2937" />
                  <Text style={styles.menuText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("OrderHistory");
                  }}
                >
                  <Icon.FileText width={22} height={22} stroke="#1F2937" />
                  <Text style={styles.menuText}>Order History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("Points");
                  }}
                >
                  <Icon.Star width={22} height={22} stroke="#1F2937" />
                  <Text style={styles.menuText}>My Points</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("CouponHistory");
                  }}
                >
                  <Icon.Gift width={22} height={22} stroke="#1F2937" />
                  <Text style={styles.menuText}>My Coupons</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowSidebar(false);
                navigation.navigate("Terms");
              }}
            >
              <Icon.FileText width={22} height={22} stroke="#1F2937" />
              <Text style={styles.menuText}>Terms of use</Text>
            </TouchableOpacity>

            {!isGuest && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowSidebar(false);
                  handleDeleteAccount();
                }}
              >
                <Icon.Trash2 width={22} height={22} stroke="#dc2626" />
                <Text style={[styles.menuText, { color: "#dc2626" }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            )}

            {isGuest ? (
              <TouchableOpacity
                onPress={() => {
                  setShowSidebar(false);
                  navigation.navigate("Login");
                }}
                style={{
                  marginTop: 40,
                  backgroundColor: "#4a90e2",
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Login
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  marginTop: 40,
                  backgroundColor: "#ff6347",
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowSidebar(false)}
              style={{ marginTop: 20 }}
            >
              <Text
                style={{ color: "gray", textAlign: "center", fontSize: 15 }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 17,
    marginLeft: 12,
    fontWeight: "500",
    color: "#1F2937",
  },
};
