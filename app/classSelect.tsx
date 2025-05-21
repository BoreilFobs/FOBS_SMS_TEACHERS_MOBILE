import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.3; // Slightly smaller than subject cards

interface Class {
  id: string;
  name: string;
  stream: string;
  studentCount: number;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export default function ClassSelectionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const classes: Class[] = [
    {
      id: "1",
      name: "Form 1",
      stream: "East",
      studentCount: 42,
      icon: "users",
      color: "#6366F1", // indigo
    },
    {
      id: "2",
      name: "Form 2",
      stream: "West",
      studentCount: 38,
      icon: "users",
      color: "#10B981", // emerald
    },
    {
      id: "3",
      name: "Form 3",
      stream: "North",
      studentCount: 35,
      icon: "users",
      color: "#EF4444", // red
    },
    {
      id: "4",
      name: "Form 4",
      stream: "South",
      studentCount: 40,
      icon: "users",
      color: "#F59E0B", // amber
    },
  ];

  const renderClassCard = ({ item }: { item: Class }) => (
    <Link href={`/students`} asChild>
      <TouchableOpacity
        style={[
          styles.classCard,
          {
            backgroundColor: colors.card,
            height: CARD_HEIGHT,
          },
        ]}
        activeOpacity={0.9}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}
        >
          <Feather name={item.icon} size={28} color={item.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.className, { color: colors.text }]}>
            {item.name} <Text style={{ opacity: 0.7 }}></Text>
          </Text>
          <Text style={[styles.studentCount, { color: colors.textSecondary }]}>
            {item.studentCount} students
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          <Feather
            name="chevron-right"
            size={24}
            color={colors.textSecondary}
            style={{ opacity: 0.7 }}
          />
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Select Class</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose a class to continue
        </Text>
      </View>

      <FlatList
        data={classes}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No classes assigned
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  listContent: {
    gap: 30,
    paddingBottom: 24,
    paddingTop: 26,
  },
  columnWrapper: {
    justifyContent: "space-around",
    gap: 16,
  },
  classCard: {
    width: (Dimensions.get("window").width - 48) / 2,
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  textContainer: {
    marginBottom: 16,
  },
  className: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  studentCount: {
    fontSize: 15,
    opacity: 0.8,
    fontWeight: "500",
  },
  chevronContainer: {
    alignSelf: "flex-end",
    display: "none",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
    width: "100%",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
