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
const CARD_HEIGHT = width * 0.4; // Makes cards occupy more space

interface Subject {
  id: string;
  name: string;
  code: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export default function SubjectSelectionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const subjects: Subject[] = [
    {
      id: "1",
      name: "Mathematics",
      code: "MATH101",
      icon: "hash",
      color: "#6366F1", // indigo
    },
    {
      id: "2",
      name: "English",
      code: "ENG202",
      icon: "book-open",
      color: "#10B981", // emerald
    },
    {
      id: "3",
      name: "Physics",
      code: "PHY301",
      icon: "aperture",
      color: "#EF4444", // red
    },
    {
      id: "4",
      name: "Chemistry",
      code: "CHEM301",
      icon: "droplet",
      color: "#F59E0B", // amber
    },
  ];

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <Link href={"/classSelect"} asChild>
      <TouchableOpacity
        style={[
          styles.subjectCard,
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
          <Feather name={item.icon} size={32} color={item.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>
            {item.code}
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
        <Text style={[styles.title, { color: colors.text }]}>
          Your Subjects
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select to enter marks
        </Text>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2} // Creates a grid layout
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="book" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No subjects assigned
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
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 46,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    opacity: 0.75,
    letterSpacing: 0.3,
  },
  listContent: {
    gap: 30,
    paddingTop: 26,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-around",
    gap: 16,
  },
  subjectCard: {
    width: (Dimensions.get("window").width - 48) / 2,
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: "space-between",
    alignItems: "center",
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
  subjectName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 16,
    opacity: 0.75,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  chevronContainer: {
    alignSelf: "flex-end",
    marginTop: 4,
    display: "none",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 80,
    width: "100%",
  },
  emptyText: {
    marginTop: 20,
    fontSize: 17,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
});
