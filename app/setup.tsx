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
  Image,
} from 'react-native'; 
import Slider from '@react-native-community/slider';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SETUP_STEPS = ['qualifications', 'specialization', 'bio', 'contact', 'experience', 'profile'];

export default function TeacherSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    qualifications: '',
    specialization: '',
    bio: '',
    phone: '',
    address: '',
    experience: 1,
    profilePhoto: null as string | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  const animateSlide = (direction: 'left' | 'right') => {
    slideAnim.setValue(direction === 'left' ? -50 : 50);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      let uri = result.assets[0].uri;
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setFormData({ ...formData, profilePhoto: manipulatedImage.uri });
    }
  };

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      animateSlide('left');
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateSlide('right');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) throw new Error('User ID not found. Please log in again.');

      const formDataToSubmit = new FormData();
      if (formData.profilePhoto) {
        formDataToSubmit.append('profile_photo', {
          uri: formData.profilePhoto,
          name: `profile_${userId}.jpg`,
          type: 'image/jpeg',
        });
      }

      formDataToSubmit.append('user_id', userId);
      formDataToSubmit.append('qualifications', formData.qualifications);
      formDataToSubmit.append('specialization', formData.specialization);
      formDataToSubmit.append('bio', formData.bio);
      formDataToSubmit.append('phone', formData.phone);
      formDataToSubmit.append('address', formData.address);
      formDataToSubmit.append('experience', formData.experience.toString());
      console.log(formDataToSubmit);
      

      const response = await axios.post(`${API_URL}/teacher/setup`, formDataToSubmit, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      await AsyncStorage.setItem('teacher', JSON.stringify(response.data.teacher));
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save setup information');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepContent = () => {
      switch(SETUP_STEPS[currentStep]) {
        case 'qualifications':
          return (
            <>
              <Ionicons name="school-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Qualifications
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                List your degrees, certifications, and credentials (separate with commas)
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
            </>
          );
        case 'specialization':
          return (
            <>
              <Ionicons name="ribbon-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Specialization
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                What subjects or areas do you specialize in? (separate with commas)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Mathematics, Physics, Elementary Education..."
                placeholderTextColor={colors.textSecondary}
                value={formData.specialization}
                onChangeText={(text) => setFormData({...formData, specialization: text})}
              />
            </>
          );
        case 'bio':
          return (
            <>
              <Ionicons name="document-text-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Teaching Bio
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Describe your teaching philosophy, methods, and what makes you unique
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  height: 120,
                  textAlignVertical: 'top'
                }]}
                placeholder="I have 10 years experience teaching with a focus on..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
              />
            </>
          );
        case 'contact':
          return (
            <>
              <Ionicons name="call-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Contact Information
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Where students can reach you (will be visible to enrolled students only)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
              />
              <TextInput
                style={[styles.input, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  marginTop: 16
                }]}
                placeholder="Address (City, Country)"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
              />
            </>
          );
        case 'experience':
          return (
            <>
              <Ionicons name="briefcase-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Teaching Experience
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                How many years of teaching experience do you have?
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {formData.experience} {formData.experience === 1 ? 'year' : 'years'}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={30}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                  value={formData.experience}
                  onValueChange={(value) => setFormData({...formData, experience: value})}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>0</Text>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>5</Text>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>10</Text>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>15</Text>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>20+</Text>
                </View>
              </View>
            </>
          );
        case 'profile':
          return (
            <>
              <Ionicons name="camera-outline" size={48} color={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Profile Photo
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Add a professional photo that represents you (recommended: face clearly visible)
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
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
          opacity: slideAnim.interpolate({
            inputRange: [-50, 0, 50],
            outputRange: [0.5, 1, 0.5],
          }),
        }}
      >
        <View style={styles.stepContainer}>
          {stepContent()}
        </View>
      </Animated.View>
    );
  };

  return (
    <AuthWrapper>
      <ImageBackground 
        source={require('@/assets/images/auth-bg2.jpg')} 
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={180} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <View style={styles.progressContainer}>
              {SETUP_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    { 
                      backgroundColor: i === currentStep ? colors.primary : colors.border,
                      width: i === currentStep ? 24 : 8,
                    }
                  ]}
                />
              ))}
            </View>

            <View style={styles.contentContainer}>
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {renderStep()}
              </ScrollView>
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
                      {currentStep === SETUP_STEPS.length - 1 ? 'Complete Profile' : 'Continue'}
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
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
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
    paddingHorizontal: 20,
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
  sliderContainer: {
    width: '100%',
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
  },
});