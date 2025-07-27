import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import useUserStore from '@/utils/stores/userStore';
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user, teacher, updateTeacher } = useUserStore();

  const [formData, setFormData] = useState({
    qualifications: teacher?.qualifications || "",
    specialization: teacher?.specialization || "",
    experience: teacher?.experience || "",
    phone: teacher?.phone || "",
    address: teacher?.address || "",
    bio: teacher?.bio || "",
  });
  const [profilePhoto, setProfilePhoto] = useState(teacher?.profile_photo || null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', user?.id.toString());
      formDataToSend.append('qualifications', formData.qualifications);
      formDataToSend.append('specialization', formData.specialization);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('bio', formData.bio);
      
      if (profilePhoto && profilePhoto.startsWith('file://')) {
        formDataToSend.append('profile_photo', {
          uri: profilePhoto,
          name: 'profile.jpg',
          type: 'image/jpeg'
        } as any);
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/teacher/update-profile`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        updateTeacher(data.teacher);
        Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while updating your profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={Platform.OS == 'ios' ? 330 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 44 }} /> {/* Spacer for alignment */}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileSection, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {profilePhoto ? (
              <Image 
                source={{ uri: `${process.env.EXPO_PUBLIC_WEB_BASE_URL}/storage/${profilePhoto}` }} 
                style={styles.profilePhoto} 
              />
            ) : (
              <LinearGradient
                colors={[colors.primary + '40', colors.primary + '10']}
                style={styles.profilePhoto}
              >
                <Feather name="user" size={40} color={colors.primary} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC']}
              style={styles.editPhotoButton}
            >
              <Feather name="edit" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          {/* Modern Input Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="school-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Qualifications</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.qualifications}
                onChangeText={(text) => setFormData({...formData, qualifications: text})}
                placeholder="Enter your qualifications"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Specialization</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.specialization}
                onChangeText={(text) => setFormData({...formData, specialization: text})}
                placeholder="Enter your specialization"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Experience</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.experience}
                onChangeText={(text) => setFormData({...formData, experience: text})}
                placeholder="Enter your experience"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                placeholder="Enter your address"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
            </View>
            <View style={[styles.textAreaWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleUpdateProfile}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  profileSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.8,
  },
  formSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  textAreaWrapper: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    minHeight: 24,
  },
  textArea: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});