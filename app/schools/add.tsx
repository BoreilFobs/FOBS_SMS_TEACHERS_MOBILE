import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function add() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string;
    image: string;
    location: string;
  } | null>(null);

  const handleVerifyCode = () => {
    // In a real app, you would call an API here
    // This is mock data for demonstration
    if (schoolCode.length > 3) {
      setSchoolInfo({
        name: "Greenwood High School",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
        location: "Nairobi, Kenya",
      });
    }
  };

  const handleSubmitRequest = () => {
    // Handle submission logic here
    alert(`Request sent to ${schoolInfo?.name}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Enter School Code
        </Text>

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. GHS-2024"
            placeholderTextColor={colors.textSecondary}
            value={schoolCode}
            onChangeText={setSchoolCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            onPress={handleVerifyCode}
            disabled={schoolCode.length < 4}
          >
            <Feather name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {schoolInfo && (
          <View
            style={[styles.schoolPreview, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              School Found
            </Text>

            <View style={styles.schoolDetails}>
              <Image
                source={{ uri: schoolInfo.image }}
                style={styles.schoolImage}
                resizeMode="cover"
              />
              <View style={styles.schoolText}>
                <Text
                  style={[styles.schoolName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {schoolInfo.name}
                </Text>
                <Text
                  style={[
                    styles.schoolLocation,
                    { color: colors.textSecondary },
                  ]}
                >
                  <Feather name="map-pin" size={14} /> {schoolInfo.location}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitRequest}
            >
              <Text style={styles.submitButtonText}>Send Request</Text>
              <Feather name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 140,
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.9,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  verifyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  schoolPreview: {
    marginTop: 24,
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  schoolDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  schoolImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  schoolText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  schoolLocation: {
    fontSize: 14,
    opacity: 0.8,
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
