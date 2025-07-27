import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  useColorScheme
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, router } from "expo-router";

interface Request {
  id: string;
  schoolName: string;
  schoolImage: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

export default function PendingRequestsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "1",
      schoolName: "Greenwood High School",
      schoolImage:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      requestDate: "2023-06-15",
      status: "pending",
    },
    {
      id: "2",
      schoolName: "Riverside Academy",
      schoolImage: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
      requestDate: "2023-06-18",
      status: "pending",
    },
  ]);

  const handleCancelRequest = (id: string) => {
    setRequests(requests.filter((request) => request.id !== id));
    // In a real app, you would also call an API to cancel the request
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No pending requests
          </Text>
          <Link href="/schools/add" asChild>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.addButtonText}>Add a School</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[styles.requestCard, { backgroundColor: colors.card }]}
            >
              <Image
                source={{ uri: item.schoolImage }}
                style={styles.schoolImage}
                resizeMode="cover"
              />
              <View style={styles.requestInfo}>
                <Text
                  style={[styles.schoolName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.schoolName}
                </Text>
                <Text
                  style={[styles.requestDate, { color: colors.textSecondary }]}
                >
                  Requested on {new Date(item.requestDate).toLocaleDateString()}
                </Text>
                <View style={styles.statusContainer}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelRequest(item.id)}
              >
                <Feather name="x" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,

    paddingTop: 35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  schoolImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 16,
  },
  requestInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "500",
  },
  cancelButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
