import { Feather as Icon } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../constants/supabase";
import { useCart } from "../context/CartContext";
import { themeColors } from "../theme";

export default function Products() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  let item = params;

  // Debug: Agregar logs al inicio
  console.log("=== PRODUCTO COMPLETO ===");
  console.log(JSON.stringify(item, null, 2));
  console.log("CategoryId específico:", item.CategoryId);
  console.log("========================");

  const [quantity, setQuantity] = useState(1);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboSelected, setComboSelected] = useState(false);
  const [sodas, setSodas] = useState([]);
  const [cookies, setCookies] = useState([]);
  const [selectedSoda, setSelectedSoda] = useState("");
  const [selectedCookie, setSelectedCookie] = useState("");
  const [comboSoda, setComboSoda] = useState(null);
  const [comboCookie, setComboCookie] = useState(null);
  const [productCategoryId, setProductCategoryId] = useState(null);

  // Función para verificar si el combo está disponible para esta categoría
  const isComboAvailable = () => {
    if (productCategoryId === null) return false;

    const numCategoryId = Number(productCategoryId);
    console.log("Verificando combo - CategoryId:", numCategoryId);

    const isAvailable = numCategoryId === 6 || numCategoryId === 16;
    console.log("Combo disponible:", isAvailable);

    return isAvailable; // Solo Hot Sandwich (6) y Quesadillas (16)
  };

  const updateQuantity = (type) => {
    let newQuantity = type === "increase" ? quantity + 1 : quantity - 1;
    if (newQuantity < 1) newQuantity = 1;
    setQuantity(newQuantity);
  };

  const toggleIngredient = (id) => {
    setSelectedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchProductData = async () => {
      // Primero obtener la información completa del producto incluyendo CategoryId
      const { data: productData, error: productError } = await supabase
        .from("Products")
        .select("CategoryId")
        .eq("Id", item.id)
        .single();

      if (!productError && productData) {
        setProductCategoryId(productData.CategoryId);
        console.log("CategoryId obtenido de la DB:", productData.CategoryId);
      }
    };

    const fetchIngredients = async () => {
      const { data, error } = await supabase
        .from("Ingredients")
        .select("*")
        .eq("product_id", item.id);

      if (!error && data) {
        setIngredients(data);
        const initial = {};
        data.forEach((ing) => (initial[ing.id] = true));
        setSelectedIngredients(initial);
      }
    };

    const fetchCombos = async () => {
      const [sodaRes, cookieRes] = await Promise.all([
        supabase
          .from("Products")
          .select("Id, Name, Price")
          .eq("CategoryId", 11),
        supabase
          .from("Products")
          .select("Id, Name, Price")
          .eq("CategoryId", 14),
      ]);
      if (sodaRes.data) setSodas(sodaRes.data);
      if (cookieRes.data) setCookies(cookieRes.data);
    };

    fetchProductData();
    fetchIngredients();
    fetchCombos();
  }, [item.id]);

  // ---- COMBO: manejar los objetos seleccionados ----
  const handleAddCombo = () => {
    const sodaId = selectedSoda === "" ? null : Number(selectedSoda);
    const cookieId = selectedCookie === "" ? null : Number(selectedCookie);

    const foundSoda = sodas.find((s) => s.Id === sodaId);
    const foundCookie = cookies.find((c) => c.Id === cookieId);

    setComboSoda(foundSoda ? { ...foundSoda } : null);
    setComboCookie(foundCookie ? { ...foundCookie } : null);

    setShowComboModal(false);
  };

  // --- CALCULAR PRECIOS (con soporte para combo) ---
  const basePrice = Number(item.Price ?? item.price ?? 0) || 0;
  const comboSodaPrice = comboSoda?.Price ? Number(comboSoda.Price) : 0;
  const comboCookiePrice = comboCookie?.Price ? Number(comboCookie.Price) : 0;
  const productUnitPrice = basePrice + comboSodaPrice + comboCookiePrice;
  const subTotal = productUnitPrice * quantity;
  const taxAmount = subTotal * 0.06;
  const finalTotal = subTotal + taxAmount;

  // --- ESTE ES EL CAMBIO CLAVE PARA ENVIAR LOS EXTRAS COMO OBJETOS ---
  const handleAddToCart = () => {
    // Ingredientes
    const selectedIngredientsArr = Object.entries(selectedIngredients)
      .filter(([_, value]) => value)
      .map(([id]) => ({ ingredient_id: parseInt(id) }));

    // Productos extra de combo (solo si el combo está disponible y seleccionado)
    let comboExtrasArr = [];
    if (isComboAvailable() && comboSelected) {
      if (comboSoda && comboSoda.Id) {
        comboExtrasArr.push({ product_id: comboSoda.Id });
      }
      if (comboCookie && comboCookie.Id) {
        comboExtrasArr.push({ product_id: comboCookie.Id });
      }
    }

    const extras = [...selectedIngredientsArr, ...comboExtrasArr];

    addToCart(
      {
        id: item.id,
        name: item.Name,
        image: item.image,
        price: productUnitPrice,
        description: item.description,
        extras, // ahora es un array de objetos {ingredient_id} o {product_id}
      },
      quantity
    );

    navigation.navigate("Home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="relative">
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 280 }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              top: 50,
              left: 20,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: 10,
              borderRadius: 50,
              elevation: 5,
            }}
          >
            <Icon.ArrowLeft strokeWidth={3} stroke={themeColors.bgColor(1)} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            marginTop: -40,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>{item.Name}</Text>
          <Text style={{ color: "gray", fontSize: 14, marginVertical: 10 }}>
            {item.description || "Descripción del producto..."}
          </Text>

          <Text style={{ fontWeight: "bold", fontSize: 18 }}>Ingredients:</Text>
          {ingredients.map((ing) => (
            <TouchableOpacity
              key={ing.id}
              onPress={() => toggleIngredient(ing.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "#FFA500",
                  backgroundColor: selectedIngredients[ing.id]
                    ? "#FFA500"
                    : "white",
                  marginRight: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedIngredients[ing.id] && (
                  <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>
                )}
              </View>
              <Text>{ing.name}</Text>
            </TouchableOpacity>
          ))}

          {/* COMBO CHECK - Solo mostrar si está disponible para esta categoría */}
          {isComboAvailable() && (
            <TouchableOpacity
              onPress={() => {
                setComboSelected(!comboSelected);
                if (!comboSelected) setShowComboModal(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "#FFA500",
                  backgroundColor: comboSelected ? "#FFA500" : "white",
                  marginRight: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {comboSelected && (
                  <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>
                )}
              </View>
              <Text style={{ fontWeight: "bold" }}>Combo</Text>
            </TouchableOpacity>
          )}

          {/* MOSTRAR ELECCIÓN DE COMBO DEBAJO - Solo si está disponible y seleccionado */}
          {isComboAvailable() && comboSelected && (
            <View style={{ marginLeft: 30, marginTop: 10 }}>
              {comboSoda && (
                <Text style={{ marginBottom: 4 }}>
                  Soda: {comboSoda.Name} - ${comboSoda.Price}
                </Text>
              )}
              {comboCookie && (
                <Text style={{ marginBottom: 4 }}>
                  Chips or Cookies: {comboCookie.Name} - ${comboCookie.Price}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Combo con Dropdown - Solo si está disponible */}
      {isComboAvailable() && (
        <Modal visible={showComboModal} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                Select Combo
              </Text>

              {/* DROPDOWN SODAS */}
              <Text style={{ marginTop: 10, fontWeight: "bold" }}>Soda:</Text>
              <Picker
                selectedValue={selectedSoda}
                onValueChange={(itemValue) =>
                  setSelectedSoda(itemValue ? Number(itemValue) : "")
                }
                style={{ width: "100%" }}
              >
                <Picker.Item label="Select a soda..." value="" />
                {sodas &&
                  sodas.length > 0 &&
                  sodas.map((soda) => (
                    <Picker.Item
                      key={soda.Id}
                      label={`${soda.Name}`}
                      value={soda.Id}
                    />
                  ))}
              </Picker>

              {/* DROPDOWN CHIPS & COOKIES */}
              <Text style={{ marginTop: 10, fontWeight: "bold" }}>
                Chips or Cookies:
              </Text>
              <Picker
                selectedValue={selectedCookie}
                onValueChange={(itemValue) =>
                  setSelectedCookie(itemValue ? Number(itemValue) : "")
                }
                style={{ width: "100%" }}
              >
                <Picker.Item label="Select one..." value="" />
                {cookies &&
                  cookies.length > 0 &&
                  cookies.map((cookie) => (
                    <Picker.Item
                      key={cookie.Id}
                      label={`${cookie.Name}`}
                      value={cookie.Id}
                    />
                  ))}
              </Picker>

              <TouchableOpacity
                onPress={handleAddCombo}
                style={{
                  backgroundColor: "#FFA500",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 16,
                  alignSelf: "flex-end",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Add products
                </Text>
              </TouchableOpacity>
              <Pressable
                onPress={() => setShowComboModal(false)}
                style={{ marginTop: 10, alignSelf: "flex-end" }}
              >
                <Text style={{ color: "#FFA500", fontWeight: "bold" }}>
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Add to Cart Button */}
      <TouchableOpacity
        onPress={handleAddToCart}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#FFA500",
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 15,
          elevation: 5,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFA500" }}>
            {quantity}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          Add Cart
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          ${finalTotal.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
