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
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import axios from "axios";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import Toast from 'react-native-toast-message';
import Config from '@/constants/Config';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AddSchoolScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const [schoolCode, setSchoolCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSchoolInfo(null); // Clear previous school info
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError("Please login again");
        setIsLoading(false);
        return;
      }

      // Search for school by code
      const response = await axios.post(
        `${Config.apiBaseUrl}/teacher-request`,
        {
          code: schoolCode
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('School search response:', response.data);

      // Handle response format from backend
      if (response.data && response.data.success && response.data.school) {
        const school = response.data.school;
        setSchoolInfo(school);
        
        if (Platform.OS !== 'web') {
          Toast.show({
            type: 'success',
            text1: 'School Found',
            text2: `${school.name}`,
            visibilityTime: 3000,
          });
        }
      } else if (response.data && response.data.message) {
        // Backend returned a message (school not found)
        setError(response.data.message);
      } else {
        setError("School not found with this code");
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.log('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
      }
      
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.response?.data?.error || `Request failed with status ${error.response?.status || 'unknown'}`
        : "Network error occurred";
      setError(message);
      
      if (Platform.OS !== 'web') {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: message,
          visibilityTime: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!schoolInfo) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const teacherStr = await AsyncStorage.getItem('teacher');
      
      if (!token) {
        setError("Please login again");
        setIsSubmitting(false);
        return;
      }

      if (!teacherStr) {
        setError("Teacher information not found. Please complete your profile setup.");
        setIsSubmitting(false);
        router.push('/setup');
        return;
      }

      const teacher = JSON.parse(teacherStr);
      
      if (!teacher?.id) {
        setError("Invalid teacher data. Please login again.");
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting request with:', {
        school_id: schoolInfo.id,
        teacher_id: teacher.id,
      });

      const response = await axios.post(
        `${Config.webBaseUrl}/teacher-create-request`,
        {
          school_id: schoolInfo.id,
          teacher_id: teacher.id,
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Request response:', response.data);

      // Check for success in response (status 201 or success field)
      if (response.status === 201 || response.data.success) {
        const successMessage = `Your request to join ${schoolInfo.name} has been submitted successfully`;
        
        if (Platform.OS === 'web') {
          showAlert('Request Sent', successMessage);
          setTimeout(() => router.push('/'), 1000);
        } else {
          Toast.show({
            type: 'success',
            text1: 'Request Sent',
            text2: successMessage,
            visibilityTime: 3000,
            onHide: () => router.push('/'),
          });
        }
        
        // Clear form
        setSchoolCode('');
        setSchoolInfo(null);
        setError(null);
      } else {
        const errorMsg = response.data.message || "Failed to submit request";
        setError(errorMsg);
        
        if (Platform.OS !== 'web') {
          Toast.show({
            type: 'error',
            text1: 'Submission Failed',
            text2: errorMsg,
            visibilityTime: 4000,
          });
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      // Handle 409 (duplicate request) specifically
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message = error.response?.data?.message || "You have already sent a request to this school";
        setError(message);
        
        if (Platform.OS === 'web') {
          showAlert('Duplicate Request', message);
        } else {
          Toast.show({
            type: 'info',
            text1: 'Already Requested',
            text2: message,
            visibilityTime: 4000,
          });
        }
      } else {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.response?.data?.error || "Failed to submit request"
          : "Network error occurred";
        
        setError(message);
        
        if (Platform.OS === 'web') {
          showAlert('Submission Failed', message);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Submission Failed',
            text2: message,
            visibilityTime: 4000,
          });
        }
      }
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
        <BlurView 
          intensity={Platform.OS === 'ios' ? 330 : 100} 
          style={StyleSheet.absoluteFill} 
          tint={colorScheme === 'dark' ? 'dark' : 'light'} 
        />
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']
              : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']
          }
          style={styles.gradientContainer}
        >
          <BlurView 
            intensity={Platform.OS === 'ios' ? 20 : 10} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'} 
            style={styles.modalBlurContainer}
          >
            <View style={[styles.modalContent, { 
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(0,0,0,0.3)' 
                : 'rgba(255,255,255,0.5)'
            }]}>
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
                  intensity={Platform.OS === 'ios' ? 12 : 6} 
                  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                  style={[styles.schoolCard, { 
                    backgroundColor: colorScheme === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.1)',
                  }]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>School Found</Text>
                  
                  <View style={styles.schoolInfo}>
                    <Image
                      source={{ 
                        uri: schoolInfo.logo 
                          ? `${Config.webBaseUrl}/storage/${schoolInfo.logo}` 
                          : 'https://via.placeholder.com/150' 
                      }}
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