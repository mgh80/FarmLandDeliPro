import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Icon from "react-native-feather";
import { SafeAreaView } from "react-native-safe-area-context";
import Carousel from "../components/carousel";
import Categories from "../components/categories";
import FeaturedRow from "../components/featuredRow";
import RewardsSection from "../components/rewardsSection";
import { useCategories, useProducts } from "../constants";
import { supabase } from "../constants/supabase";
import { useCart } from "../context/CartContext";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getTotalItems } = useCart();

  const [showSidebar, setShowSidebar] = useState(false);
  const [pressedIcon, setPressedIcon] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userName, setUserName] = useState("");

  const products = useProducts();
  const categories = useCategories();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace("Login");
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("Users")
          .select("name")
          .eq("id", user.id)
          .single();

        if (data) setUserName(data.name);
      }
    };

    fetchUserName();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      {/* Saludo superior */}
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
          ¡Hello! {userName}
        </Text>
      </View>

      {/* Buscador */}
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

      {/* Contenido */}
      <ScrollView
        style={{ marginTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        <Carousel />
        {categories.map((cat) => {
          const productsInCategory = products.filter(
            (p) => p.CategoryId === cat.Id
          );
          if (activeCategory && cat.Name !== activeCategory) return null;
          const filteredProducts = productsInCategory.filter((p) =>
            p.Name.toLowerCase().includes(searchText.toLowerCase())
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

      {/* Barra inferior */}
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
        <Pressable
          onPressIn={() => setPressedIcon("home")}
          onPressOut={() => setPressedIcon(null)}
          style={{ alignItems: "center" }}
        >
          <Icon.Home
            width={26}
            height={26}
            stroke={pressedIcon === "home" ? "#1F2937" : "#6B7280"}
          />
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: pressedIcon === "home" ? "#1F2937" : "#6B7280",
              fontWeight: pressedIcon === "home" ? "600" : "400",
            }}
          >
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Cart")}
          onPressIn={() => setPressedIcon("cart")}
          onPressOut={() => setPressedIcon(null)}
          style={{ position: "relative", alignItems: "center" }}
        >
          <Icon.ShoppingCart
            width={26}
            height={26}
            stroke={pressedIcon === "cart" ? "#1F2937" : "#6B7280"}
          />
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
              color: pressedIcon === "cart" ? "#1F2937" : "#6B7280",
              fontWeight: pressedIcon === "cart" ? "600" : "400",
            }}
          >
            Cart
          </Text>
        </Pressable>

        <Pressable
          onPressIn={() => setPressedIcon("profile")}
          onPressOut={() => setPressedIcon(null)}
          onPress={() => setShowSidebar(true)}
          style={{ alignItems: "center" }}
        >
          <Icon.User
            width={24}
            height={24}
            stroke={pressedIcon === "profile" ? "#1F2937" : "#6B7280"}
          />
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: pressedIcon === "profile" ? "#1F2937" : "#6B7280",
              fontWeight: pressedIcon === "profile" ? "600" : "400",
            }}
          >
            Profile
          </Text>
        </Pressable>
      </View>

      {/* Sidebar */}
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
          {/* Zona clickeable para cerrar */}
          <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          {/* PANEL */}
          <View
            style={{
              width: "78%",
              height: "100%",
              backgroundColor: "white",
              paddingTop: 40,
              paddingHorizontal: 20,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,

              // sombreado moderno
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: -2, height: 0 },
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {/* Header */}
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

            {/* Opciones */}
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

            {/* Logout */}
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

            {/* Cerrar */}
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
