// CouponHistoryScreen.js
import { Feather as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../constants/supabase";

const CouponHistoryScreen = () => {
  const navigation = useNavigation();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // -----------------------------
  // 🔄 Cargar cupones según filtro
  // -----------------------------
  useEffect(() => {
    fetchCoupons();
  }, [selectedFilter]);

  const fetchCoupons = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let query = supabase
          .from("Coupons")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (selectedFilter === "active") {
          query = query
            .eq("status", "active")
            .gt("expiration_date", new Date().toISOString());
        } else if (selectedFilter === "used") {
          query = query.eq("status", "used");
        } else if (selectedFilter === "expired") {
          query = query.lt("expiration_date", new Date().toISOString());
        }

        const { data, error } = await query;

        if (!error) setCoupons(data || []);
        else console.error("Error fetching coupons:", error);
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoupons();
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // -----------------------------
  // 🎨 Determinar icono y colores
  // -----------------------------
  const getStatusColor = (coupon) => {
    const now = new Date();
    const expiration = new Date(coupon.expiration_date);

    if (coupon.status === "used") return "#6B7280";
    if (expiration < now) return "#EF4444";
    return "#22C55E";
  };

  const getStatusText = (coupon) => {
    const now = new Date();
    const expiration = new Date(coupon.expiration_date);

    if (coupon.status === "used") return "Used";
    if (expiration < now) return "Expired";
    return "Active";
  };

  // ⛔ AQUÍ ESTABA TU ERROR — iconos incorrectos
  const getStatusIcon = (coupon) => {
    const now = new Date();
    const expiration = new Date(coupon.expiration_date);

    if (coupon.status === "used") return "check-circle";
    if (expiration < now) return "clock";
    return "gift";
  };

  // -----------------------------
  // 🎁 Render de cada cupón
  // -----------------------------
  const renderCouponItem = ({ item }) => {
    const iconName = getStatusIcon(item);

    return (
      <View style={styles.couponItem}>
        <View style={styles.couponHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.couponTitle}>{item.reward_title}</Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item) },
              ]}
            >
              <Icon name={iconName} size={14} color="white" />
              <Text style={styles.statusText}>{getStatusText(item)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.couponDescription}>{item.reward_description}</Text>

        <View style={styles.couponDetails}>
          <View style={styles.detailRow}>
            <Icon name="hash" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Code:</Text>
            <Text style={styles.detailValue}>{item.coupon_code}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="file-text" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Order:</Text>
            <Text style={styles.detailValue}>{item.order_number}</Text>
          </View>
        </View>

        <View style={styles.couponFooter}>
          <View style={styles.pointsContainer}>
            <Icon name="award" size={16} color="#FFA500" />
            <Text style={styles.pointsText}>{item.points_used} points</Text>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Created:</Text>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Expires:</Text>
            <Text style={styles.dateText}>
              {formatDate(item.expiration_date)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: "all", label: "All", count: coupons.length },
    { key: "active", label: "Active" },
    { key: "used", label: "Used" },
    { key: "expired", label: "Expired" },
  ];

  // -----------------------------
  // ⏳ Loading
  // -----------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Coupons</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Loading coupons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------
  // 📄 Render principal
  // -----------------------------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.activeFilterButtonText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {coupons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="gift" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No coupons found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter === "all"
              ? "You haven't earned any rewards yet. Start earning points to get coupons!"
              : `No ${selectedFilter} coupons found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.coupon_code}
          renderItem={renderCouponItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#6B7280" },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  activeFilterButton: { backgroundColor: "#FFA500" },
  filterButtonText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  activeFilterButtonText: { color: "white" },
  listContainer: { padding: 20 },
  couponItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  couponHeader: { marginBottom: 12 },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  couponDescription: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  couponDetails: { marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  couponFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFA500",
    marginLeft: 6,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateLabel: { fontSize: 12, color: "#6B7280", width: 60 },
  dateText: { fontSize: 12, color: "#1F2937" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default CouponHistoryScreen;
