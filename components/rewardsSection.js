// RewardsSection.js - Componente actualizado
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { supabase } from "../constants/supabase";
import * as Icon from "react-native-feather";
import CouponModal from "./CouponModal";

const rewards = [
  {
    id: 1,
    title: "Espresso Shot / Syrup",
    points: 25,
    description: "Extra shot or a dash of syrup",
    image: require("../assets/images/1.jpg"),
  },
  {
    id: 2,
    title: "Coffee / Tea / Snack",
    points: 100,
    description: "Hot or iced coffee, tea, bakery or chips",
    image: require("../assets/images/2.jpg"),
  },
  {
    id: 3,
    title: "Latte / Breakfast",
    points: 200,
    description: "Latte, cappuccino or oatmeal",
    image: require("../assets/images/3.jpg"),
  },
  {
    id: 4,
    title: "Frappuccino & Cookie",
    points: 300,
    description: "Any Frappuccino with a cookie",
    image: require("../assets/images/4.jpg"),
  },
  {
    id: 5,
    title: "Cuban Combo",
    points: 400,
    description: "Cuban sandwich, soda, chips & cookie",
    image: require("../assets/images/5.jpg"),
  },
];

const RewardsSection = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from("Users")
          .select("points")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          setUserPoints(data.points || 0);
        }
      }
    };
    fetchUserData();
  }, []);

  const generateCouponCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `RWD-${timestamp}-${random}`;
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return "ORD-" + datePart + "-" + randomPart;
  };

  const handleRewardClaim = async (reward) => {
    if (userPoints < reward.points) return;

    try {
      // Generar datos del cupón
      const couponData = {
        id: generateCouponCode(),
        orderNumber: generateOrderNumber(),
        rewardTitle: reward.title,
        rewardDescription: reward.description,
        pointsUsed: reward.points,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        createdAt: new Date(),
        userId: userId,
        status: "active",
      };

      // Guardar cupón en Supabase
      const { error: couponError } = await supabase.from("Coupons").insert([
        {
          coupon_code: couponData.id,
          order_number: couponData.orderNumber,
          user_id: userId,
          reward_title: reward.title,
          reward_description: reward.description,
          points_used: reward.points,
          expiration_date: couponData.expirationDate.toISOString(),
          status: "active",
          created_at: new Date().toISOString(),
        },
      ]);

      if (couponError) {
        console.error("Error saving coupon:", couponError);
        return;
      }

      // Descontar puntos del usuario
      const { error: pointsError } = await supabase
        .from("Users")
        .update({ points: userPoints - reward.points })
        .eq("id", userId);

      if (pointsError) {
        console.error("Error updating points:", pointsError);
        return;
      }

      // Actualizar estado local
      setUserPoints(userPoints - reward.points);
      setGeneratedCoupon(couponData);
      setShowCouponModal(true);
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pointsText}>
          You have <Text style={styles.pointsHighlight}>{userPoints}</Text>{" "}
          points
        </Text>
        <Text style={styles.rewardsTitle}>Available Rewards</Text>
      </View>

      <FlatList
        horizontal
        data={rewards}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => {
          const locked = userPoints < item.points;

          return (
            <TouchableOpacity
              style={[styles.rewardCard, locked && styles.lockedCard]}
              onPress={() => !locked && handleRewardClaim(item)}
              disabled={locked}
              activeOpacity={0.8}
            >
              <Image
                source={item.image}
                style={[styles.rewardImage, locked && styles.lockedImage]}
              />

              <View style={styles.pointsTag}>
                {locked ? (
                  <>
                    <Icon.Lock stroke="#9CA3AF" width={14} height={14} />
                    <Text style={styles.pointsRequired}>{item.points} pts</Text>
                  </>
                ) : (
                  <View style={styles.unlockedSection}>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                    <Text style={styles.pointsUnlocked}>{item.points} pts</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.rewardTitle, locked && styles.lockedText]}>
                {item.title}
              </Text>
              <Text
                style={[styles.rewardDescription, locked && styles.lockedText]}
              >
                {item.description}
              </Text>

              {!locked && (
                <View style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>Tap to Claim</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <CouponModal
        visible={showCouponModal}
        coupon={generatedCoupon}
        onClose={() => setShowCouponModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 16,
    color: "#1F2937",
  },
  pointsHighlight: {
    fontWeight: "bold",
    color: "#FFA500",
    fontSize: 18,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 4,
  },
  rewardCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  lockedCard: {
    opacity: 0.6,
  },
  rewardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 10,
  },
  lockedImage: {
    opacity: 0.5,
  },
  pointsTag: {
    alignItems: "center",
    marginBottom: 6,
    minHeight: 30,
  },
  unlockedSection: {
    alignItems: "center",
  },
  availableBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  availableText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  pointsUnlocked: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },
  pointsRequired: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  lockedText: {
    color: "#9CA3AF",
  },
  claimButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  claimButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default RewardsSection;

// import React, { useEffect, useState } from "react";
// import { View, Text, FlatList, Image, StyleSheet } from "react-native";
// import { supabase } from "../constants/supabase";
// import * as Icon from "react-native-feather";

// const rewards = [
//   {
//     id: 1,
//     title: "Espresso Shot / Syrup",
//     points: 25,
//     description: "Extra shot or a dash of syrup",
//     image: require("../assets/images/1.jpg"),
//   },
//   {
//     id: 2,
//     title: "Coffee / Tea / Snack",
//     points: 100,
//     description: "Hot or iced coffee, tea, bakery or chips",
//     image: require("../assets/images/2.jpg"),
//   },
//   {
//     id: 3,
//     title: "Latte / Breakfast",
//     points: 200,
//     description: "Latte, cappuccino or oatmeal",
//     image: require("../assets/images/3.jpg"),
//   },
//   {
//     id: 4,
//     title: "Frappuccino & Cookie",
//     points: 300,
//     description: "Any Frappuccino with a cookie",
//     image: require("../assets/images/4.jpg"),
//   },
//   {
//     id: 5,
//     title: "Cuban Combo",
//     points: 400,
//     description: "Cuban sandwich, soda, chips & cookie",
//     image: require("../assets/images/5.jpg"),
//   },
// ];

// const RewardsSection = () => {
//   const [userPoints, setUserPoints] = useState(0);

//   useEffect(() => {
//     const fetchPoints = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (user) {
//         const { data, error } = await supabase
//           .from("Users")
//           .select("points")
//           .eq("id", user.id)
//           .single();
//         if (!error && data) {
//           setUserPoints(data.points || 0);
//         }
//       }
//     };
//     fetchPoints();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.pointsText}>
//           You have <Text style={styles.pointsHighlight}>{userPoints}</Text>{" "}
//           points
//         </Text>
//         <Text style={styles.rewardsTitle}>Available Rewards</Text>
//       </View>

//       <FlatList
//         horizontal
//         data={rewards}
//         keyExtractor={(item) => item.id.toString()}
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{ paddingVertical: 10 }}
//         renderItem={({ item }) => {
//           const locked = userPoints < item.points;

//           return (
//             <View style={styles.rewardCard}>
//               <Image source={item.image} style={styles.rewardImage} />

//               <View style={styles.pointsTag}>
//                 {locked ? (
//                   <>
//                     <Icon.Lock stroke="#9CA3AF" width={14} height={14} />
//                     <Text style={styles.pointsRequired}>{item.points} pts</Text>
//                   </>
//                 ) : (
//                   <View style={styles.unlockedSection}>
//                     <View style={styles.availableBadge}>
//                       <Text style={styles.availableText}>Available</Text>
//                     </View>
//                     <Text style={styles.pointsUnlocked}>{item.points} pts</Text>
//                   </View>
//                 )}
//               </View>

//               <Text style={styles.rewardTitle}>{item.title}</Text>
//               <Text style={styles.rewardDescription}>{item.description}</Text>
//             </View>
//           );
//         }}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginTop: 20,
//     paddingHorizontal: 16,
//   },
//   header: {
//     marginBottom: 10,
//   },
//   pointsText: {
//     fontSize: 16,
//     color: "#1F2937",
//   },
//   pointsHighlight: {
//     fontWeight: "bold",
//     color: "#FFA500",
//     fontSize: 18,
//   },
//   rewardsTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#1F2937",
//     marginTop: 4,
//   },
//   rewardCard: {
//     width: 160,
//     marginRight: 12,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 12,
//     alignItems: "center",
//     // 🎯 Sombra mejorada
//     shadowColor: "#000",
//     shadowOpacity: 0.15,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 6,
//     elevation: 6,
//   },
//   rewardImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     marginBottom: 10,
//   },
//   pointsTag: {
//     alignItems: "center",
//     marginBottom: 6,
//     minHeight: 30,
//   },
//   unlockedSection: {
//     alignItems: "center",
//   },
//   availableBadge: {
//     backgroundColor: "#22C55E",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 10,
//     marginBottom: 2,
//   },
//   availableText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   pointsUnlocked: {
//     fontSize: 12,
//     color: "#22C55E",
//     fontWeight: "600",
//   },
//   pointsRequired: {
//     marginLeft: 4,
//     fontSize: 12,
//     color: "#6B7280",
//   },
//   rewardTitle: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#1F2937",
//     textAlign: "center",
//   },
//   rewardDescription: {
//     fontSize: 12,
//     color: "#6B7280",
//     textAlign: "center",
//     marginTop: 2,
//   },
// });

// export default RewardsSection;
