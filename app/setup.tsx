import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  Image
} from 'react-native'; 
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SETUP_STEPS = ['qualifications', 'specialization', 'bio', 'profile'];

export default function TeacherSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    qualifications: '',
    specialization: '',
    bio: '',
    profilePhoto: null as string | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  // getting the user informations

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({...formData, profilePhoto: result.assets[0].uri});
    }
  };

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };


const handleSubmit = async () => {
  setIsLoading(true);
  
  try {
    const userId = await AsyncStorage.getItem('user_id');
    console.log('User ID:', userId);

    if (!userId) {
      throw new Error('User ID not found. Please log in again.');
    }

    const formDataToSubmit = new FormData();

    // Append profile photo if exists
    if (formData.profilePhoto) {
      const photoData = {
        uri: formData.profilePhoto,
        name: `profile_${userId}.jpg`,
        type: 'image/jpeg',
      };
      formDataToSubmit.append('profile_photo', photoData);
    }

    // Append other text data
    formDataToSubmit.append('user_id', userId);
    formDataToSubmit.append('qualifications', formData.qualifications);
    formDataToSubmit.append('specialization', formData.specialization);
    formDataToSubmit.append('bio', formData.bio);

    // Make the API call with the formData
    await axios.post(`${API_URL}/teacher/setup`, formDataToSubmit, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}`,
      },
    });

    // Show success message or alert
    // Alert.alert('Success', 'Setup information saved successfully!');
    await new Promise(resolve => setTimeout(resolve, 1500));  // Simulate some delay
    router.push('/(tabs)');
  } catch (error) {
    Alert.alert('Error', 'Failed to save setup information');
    console.error(error);  // Add this to debug if something goes wrong
  } finally {
    setIsLoading(false);
  }
};


  const renderStep = () => {
    switch(SETUP_STEPS[currentStep]) {
      case 'qualifications':
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="school-outline" size={48} color={colors.primary} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your Qualifications
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              List your degrees, certifications, and credentials
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="PhD in Mathematics, Teaching Certificate..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              value={formData.qualifications}
              onChangeText={(text) => setFormData({...formData, qualifications: text})}
            />
          </View>
        );
      case 'specialization':
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="ribbon-outline" size={48} color={colors.primary} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your Specialization
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              What subjects or areas do you specialize in?
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Mathematics, Physics, Elementary Education..."
              placeholderTextColor={colors.textSecondary}
              value={formData.specialization}
              onChangeText={(text) => setFormData({...formData, specialization: text})}
            />
          </View>
        );
      case 'bio':
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.primary} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your Bio
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Tell students about your teaching approach and experience
            </Text>
            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.border,
                height: 120,
                textAlignVertical: 'top'
              }]}
              placeholder="I have 10 years experience teaching..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={5}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
            />
          </View>
        );
      case 'profile':
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="camera-outline" size={48} color={colors.primary} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Profile Photo
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Add a professional photo for your profile
            </Text>
            <TouchableOpacity 
              style={styles.photoContainer}
              onPress={pickImage}
            >
              {formData.profilePhoto ? (
                <Image 
                  source={{ uri: formData.profilePhoto }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profilePlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="person" size={48} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.photoButton}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <AuthWrapper>
    <ImageBackground 
      source={require('@/assets/images/auth-bg2.jpg')} 
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={180} style={StyleSheet.absoluteFill}  tint={colorScheme} />
      <BlurView intensity={180} style={StyleSheet.absoluteFill}  tint={colorScheme} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.progressContainer}>
            {SETUP_STEPS.map((_, i) => {
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.progressDot,
                    { 
                      backgroundColor: colors.primary,
                      opacity,
                      width: i === currentStep ? 16 : 8,
                    }
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.contentContainer}>
            {renderStep()}
          </View>

          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.8 : 1,
                  flex: currentStep === 0 ? 1 : undefined,
                }
              ]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {currentStep === SETUP_STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
                  </Text>
                  {currentStep < SETUP_STEPS.length - 1 && (
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  photoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});