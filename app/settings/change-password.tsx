import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  useColorScheme
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import useUserStore from '@/utils/stores/userStore';
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from '@/constants/Config';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user } = useUserStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secureEntries, setSecureEntries] = useState({
    current: true,
    new: true,
    confirm: true
  });

  const toggleSecureEntry = (field: keyof typeof secureEntries) => {
    setSecureEntries(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
     showAlert("Error", "New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
     showAlert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
        console.log(newPassword);
        
      const response = await fetch(`${Config.apiBaseUrl}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}` // Assuming you store token in user
        },
        body: JSON.stringify({
          user_id: user?.id,
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
       showAlert("Success", "Password changed successfully!");
        router.back();
      } else {
       showAlert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
     showAlert("Error", "An error occurred while changing password");
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

      <View style={[styles.header]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formSection, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.current}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('current')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.current ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-open-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.new}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('new')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.new ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('confirm')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.confirm ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleChangePassword}
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
              <Text style={styles.saveButtonText}>Change Password</Text>
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
    paddingTop: 35
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
    paddingBottom: 100,
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
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