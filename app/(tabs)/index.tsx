import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = Dimensions.get("window").height / 3.5;

interface School {
  id: string;
  name: string;
  acronym: string;
  image: any;
  status: "active" | "pending";
}

const schoolsData: School[] = [
  
  {
    id: "4",
    name: "Government High School",
    acronym: "GHS",
    image: { uri: "https://images.unsplash.com/photo-1588072432836-e10032774350" },
    status: "active",
  },
  {
    id: "5",
    name: "Presbyterian Secondary School",
    acronym: "PSS",
    image: { uri: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d" },
    status: "pending",
  },
  {
    id: "6",
    name: "Baptist High School",
    acronym: "BHS",
    image: { uri: "https://images.unsplash.com/photo-1588072432836-e10032774350" },
    status: "active",
  },
];

export default function SchoolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();

  const renderSchoolItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={styles.schoolCard}
      activeOpacity={0.9}
      onPress={() => router.push("/subjectSelect")}
    >
      <ImageBackground
        source={item.image}
        style={styles.schoolImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.imageOverlay}
        />
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={styles.schoolAcronym}>{item.acronym}</Text>
            {item.status === "pending" ? (
              <View style={styles.pendingBadge}>
                <MaterialIcons name="pending" size={14} color="#92400E" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            ) : (
              <View style={styles.activeBadge}>
                <Feather name="check-circle" size={14} color="#fff" />
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View>
          <Text style={styles.title}>FobsSMS</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select a school to begin
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push("/schools/requests")}
          >
            <View style={styles.badgeContainer}>
              <FontAwesome name="bell" size={20} color={colors.primary} />
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push("/schools/add")}
          >
            <Feather name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={schoolsData}
        renderItem={renderSchoolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="school" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No schools added yet
            </Text>
          </View>
        }
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#2563eb",
    fontFamily: Platform.OS === "ios" ? "Chalkduster" : "fantasy",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  listContent: {
    gap: 20,
    paddingBottom: 30,
  },
  schoolCard: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  schoolImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  schoolInfo: {
    padding: 20,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  schoolAcronym: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pendingBadge: {
    backgroundColor: "rgba(254, 243, 199, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});