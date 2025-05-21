import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, useRouter } from "expo-router";

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
    id: "1",
    name: "Government bilingual High School",
    acronym: "GBHS",
    image: {
      uri: "https://images.unsplash.com/photo-1588072432836-e10032774350",
    },
    status: "active",
  },
  {
    id: "2",
    name: "Azimuth higher int",
    acronym: "INSA",
    image: {
      uri: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
    },
    status: "active",
  },
  {
    id: "3",
    name: "UNIVERSITY OF BUEA",
    acronym: "UBA",
    image: {
      uri: "https://images.unsplash.com/photo-1588072432836-e10032774350",
    },
    status: "pending",
  },
];

export default function SchoolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const renderSchoolItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={[styles.schoolCard, { backgroundColor: colors.card }]}
      activeOpacity={0.9}
      onPress={() => router.push("/subjectSelect")}
    >
      <Image
        source={item.image}
        style={styles.schoolImage}
        resizeMode="cover"
      />
      <View style={styles.schoolInfo}>
        <Text
          style={[styles.schoolName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.schoolAcronym, { color: colors.textSecondary }]}>
            {item.acronym}
          </Text>
          {item.status === "pending" ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Approval</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.primary,
              fontFamily: Platform.OS === "ios" ? "Chalkduster" : "fantasy",
              fontWeight: "900",
            },
          ]}
        >
          FOBS-SMS
        </Text>
        <View style={styles.headerActions}>
          <Link
            href="/schools/requests"
            onPress={() => router.push("/schools/requests")}
            asChild
          >
            <TouchableOpacity style={styles.requestButton}>
              <FontAwesome name="bell" size={20} color={colors.primary} />
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </Link>
          <Link
            href="/schools/add"
            onPress={() => router.push("/schools/add")}
            asChild
          >
            <TouchableOpacity style={styles.addButton}>
              <Feather name="plus" size={24} color={colors.primary} />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Select a school to start filling marks
      </Text>

      <FlatList
        data={schoolsData}
        renderItem={renderSchoolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No schools added yet
            </Text>
          </View>
        }
      />
    </View>
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
    paddingBottom: 0,
    paddingTop: Platform.OS === "ios" ? 70 : 0,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 20,
  },
  requestButton: {
    position: "relative",
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  schoolImage: {
    width: "100%",
    height: "70%",
  },
  schoolInfo: {
    padding: 16,
    height: "30%",
    justifyContent: "space-between",
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  schoolAcronym: {
    fontSize: 16,
    opacity: 0.7,
    fontWeight: "600",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    fontWeight: "500",
  },
});
