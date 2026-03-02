import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../constants/supabase";

const { width, height } = Dimensions.get("window");

export default function Carousel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await supabase
        .from("Promotions")
        .select("*")
        .eq("active", true);

      if (error) {
        console.error("Error fetching promotions:", error);
      } else {
        setBanners(data);
        // Inicializar estados de carga
        const loadingStates = {};
        data.forEach((banner) => {
          loadingStates[banner.id] = true;
        });
        setImageLoadingStates(loadingStates);
      }
      setLoading(false);
    };

    fetchPromotions();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, banners]);

  const handleImageLoad = useCallback((bannerId) => {
    setImageLoadingStates((prev) => ({ ...prev, [bannerId]: false }));
  }, []);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [],
  );

  const renderBanner = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => setSelectedImage(item.image_url)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {/* Loading indicator */}
          {imageLoadingStates[item.id] && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4a90e2" />
            </View>
          )}

          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            priority="high"
            onLoad={() => handleImageLoad(item.id)}
            onError={() => handleImageLoad(item.id)}
          />
        </View>
      </TouchableOpacity>
    ),
    [imageLoadingStates, handleImageLoad],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#888" />
      </View>
    );
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offers</Text>

      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderBanner}
        extraData={activeIndex}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        decelerationRate="fast"
      />

      {/* Dots indicadores */}
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { opacity: activeIndex === index ? 1 : 0.3 }]}
          />
        ))}
      </View>

      {/* Modal de imagen ampliada */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
          <View style={styles.modalContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullscreenImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 8,
    color: "#1f2937",
  },
  loadingContainer: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 180,
  },
  imageContainer: {
    width: width,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    zIndex: 1,
  },
  image: {
    width: "94%",
    height: "100%",
    borderRadius: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4a90e2",
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
});
