import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import axios from "axios";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import Toast from 'react-native-toast-message';

export default function AddSchoolScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const [schoolCode, setSchoolCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const WEB_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL;

  const [schoolInfo, setSchoolInfo] = useState<{
    id: number;
    name: string;
    logo: string;
    address: string;
    code: string;
  } | null>(null);

  const handleVerifyCode = async () => {
    if (schoolCode.length < 4) {
      setError("School code must be at least 4 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error("Please login again");
      }

      const response = await axios.post(`${API_URL}/teacher-request`, {
        code: schoolCode,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.data.success) {
        setSchoolInfo(response.data.school);
        Toast.show({
          type: 'success',
          text1: 'School found',
          text2: response.data.message || 'You can now send request',
          visibilityTime: 3000,
        });
      } else {
        setError(response.data.message || "School not found");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || "Failed to verify school code"
        : "Network error occurred";
      setError(message);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: message,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!schoolInfo) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const teacher = JSON.parse(await AsyncStorage.getItem('teacher') || '{}');
      
      if (!token || !teacher?.id) {
        throw new Error("Please login again");
      }

      const response = await axios.post(
        `${API_URL}/teacher-create-request`,
        {
          school_id: schoolInfo.id,
          teacher_id: teacher.id,
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Request Sent',
          text2: `Your request to join ${schoolInfo.name} has been submitted`,
          visibilityTime: 3000,
          onHide: () => router.push('/schools/requests'),
        });
      } else {
        throw new Error(response.data.message || "Request failed");
      }
    } catch (error) {
      // console.error("Submission error:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to submit request"
        : "Network error occurred";
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: message,
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={100} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <LinearGradient
          colors={['rgba(46, 38, 38, 0.32)', 'rgba(97, 54, 54, 0.14)']}
          style={styles.gradientContainer}
        >
          <BlurView 
            intensity={160} 
            tint={colorScheme} 
            style={styles.modalBlurContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: 'transparent'}]}>
              <Text style={[styles.title, { color: colors.text }]}>Add School</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter the school code to send a request
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>School Code</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}
                    placeholder="e.g. GHS-2024"
                    placeholderTextColor={colors.textSecondary}
                    value={schoolCode}
                    onChangeText={(text) => {
                      setSchoolCode(text);
                      setError(null);
                    }}
                    autoCapitalize="characters"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.verifyButton, 
                      { 
                        backgroundColor: colors.primary,
                        opacity: schoolCode.length < 4 ? 0.6 : 1
                      }
                    ]}
                    onPress={handleVerifyCode}
                    disabled={schoolCode.length < 4 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Feather name="search" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
                {error && (
                  <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {error}
                    </Text>
                  </View>
                )}
              </View>

              {schoolInfo && (
                <BlurView 
                  intensity={140} 
                  tint={colorScheme} 
                  style={[styles.schoolCard, { backgroundColor: "transparent" }]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>School Found</Text>
                  
                  <View style={styles.schoolInfo}>
                    <Image
                      source={{ uri: schoolInfo.logo ? `${WEB_URL}/storage/${schoolInfo.logo}` : 'https://via.placeholder.com/150' }}
                      style={styles.schoolImage}
                      resizeMode="cover"
                    />
                    <View style={styles.schoolDetails}>
                      <Text style={[styles.schoolName, { color: colors.text }]}>
                        {schoolInfo.name}
                      </Text>
                      <View style={styles.locationRow}>
                        <Feather name="map-pin" size={14} color={colors.textSecondary} />
                        <Text style={[styles.schoolLocation, { color: colors.textSecondary }]}>
                          {schoolInfo.address}
                        </Text>
                      </View>
                      <Text style={[styles.schoolCode, { color: colors.textSecondary }]}>
                        Code: {schoolInfo.code}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton, 
                      { 
                        backgroundColor: colors.primary,
                        opacity: isSubmitting ? 0.7 : 1
                      }
                    ]}
                    onPress={handleSubmitRequest}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Send Request</Text>
                        <Feather name="send" size={18} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                </BlurView>
              )}
            </View>
          </BlurView>
        </LinearGradient>
      </ImageBackground>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  gradientContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  modalBlurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 200
  },
  modalContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,

  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  verifyButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
  },
  schoolCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  schoolInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  schoolImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 16,
  },
  schoolDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  schoolLocation: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  schoolCode: {
    fontSize: 14,
    opacity: 0.7,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});