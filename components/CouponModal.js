// CouponModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  Platform,
} from "react-native";
import * as Icon from "react-native-feather";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");

const CouponModal = ({ visible, coupon, onClose }) => {
  if (!coupon) return null;

  const formatExpirationDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const shareCoupon = async () => {
    try {
      const message = `🎉 I just earned a reward!\n\n${coupon.rewardTitle}\n${
        coupon.rewardDescription
      }\n\nCoupon Code: ${coupon.id}\nOrder: ${
        coupon.orderNumber
      }\nExpires: ${formatExpirationDate(coupon.expirationDate)}`;

      await Share.share({
        message: message,
        title: "My Farm Land Deli Reward",
      });
    } catch (error) {
      console.error("Error sharing coupon:", error);
    }
  };

  const copyCouponCode = () => {
    // En React Native necesitarías usar Clipboard API
    // Para este ejemplo, solo mostraremos un alert
    Alert.alert("Coupon Code Copied!", `Code: ${coupon.id}`, [
      { text: "OK", style: "default" },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animatable.View
          animation="bounceIn"
          duration={800}
          style={styles.container}
        >
          {/* Header con celebración */}
          <View style={styles.header}>
            <Animatable.Text
              animation="pulse"
              iterationCount="infinite"
              style={styles.celebrationEmoji}
            >
              🎉
            </Animatable.Text>
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.subtitleText}>You've earned a reward</Text>
          </View>

          {/* Cupón Principal */}
          <View style={styles.couponContainer}>
            {/* Parte superior del cupón */}
            <View style={styles.couponTop}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{coupon.rewardTitle}</Text>
                <Text style={styles.rewardDescription}>
                  {coupon.rewardDescription}
                </Text>
              </View>

              <View style={styles.pointsBadge}>
                <Icon.Award stroke="#FFA500" width={16} height={16} />
                <Text style={styles.pointsText}>{coupon.pointsUsed} pts</Text>
              </View>
            </View>

            {/* Línea de corte decorativa */}
            <View style={styles.cutLine}>
              <View style={styles.leftCircle} />
              <View style={styles.dottedLine}>
                {Array(12)
                  .fill(0)
                  .map((_, i) => (
                    <View key={i} style={styles.dot} />
                  ))}
              </View>
              <View style={styles.rightCircle} />
            </View>

            {/* Parte inferior del cupón */}
            <View style={styles.couponBottom}>
              <View style={styles.codeSection}>
                <Text style={styles.codeLabel}>Coupon Code</Text>
                <TouchableOpacity
                  onPress={copyCouponCode}
                  style={styles.codeContainer}
                >
                  <Text style={styles.codeText}>{coupon.id}</Text>
                  <Icon.Copy stroke="#666" width={16} height={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Icon.FileText stroke="#666" width={16} height={16} />
                  <Text style={styles.detailLabel}>Order #</Text>
                  <Text style={styles.detailValue}>{coupon.orderNumber}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Icon.Calendar stroke="#666" width={16} height={16} />
                  <Text style={styles.detailLabel}>Expires</Text>
                  <Text style={styles.detailValue}>
                    {formatExpirationDate(coupon.expirationDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.instructions}>
                <Icon.Info stroke="#FFA500" width={16} height={16} />
                <Text style={styles.instructionsText}>
                  Show this coupon at the store to redeem your reward
                </Text>
              </View>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={shareCoupon} style={styles.shareButton}>
              <Icon.Share2 stroke="white" width={20} height={20} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Marca de agua */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Farm Land Deli</Text>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: "center",
    paddingVertical: 25,
    backgroundColor: "#FFA500",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  couponContainer: {
    backgroundColor: "white",
    marginHorizontal: 0,
  },
  couponTop: {
    padding: 20,
    paddingBottom: 15,
  },
  rewardInfo: {
    marginBottom: 15,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  rewardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFA500",
  },
  cutLine: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
    position: "relative",
  },
  leftCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    marginLeft: -10,
  },
  rightCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    marginRight: -10,
  },
  dottedLine: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  couponBottom: {
    padding: 20,
    paddingTop: 15,
  },
  codeSection: {
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  instructions: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3E2",
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  closeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "600",
  },
  watermark: {
    position: "absolute",
    bottom: 8,
    right: 15,
  },
  watermarkText: {
    fontSize: 10,
    color: "#D1D5DB",
    fontStyle: "italic",
  },
});

export default CouponModal;
