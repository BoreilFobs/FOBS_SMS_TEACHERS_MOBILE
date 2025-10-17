import React, { useState, useRef, useEffect } from 'react';
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
  useColorScheme,
} from 'react-native'; 
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '@/constants/Config';

// Platform-specific slider import
let SliderComponent;
if (Platform.OS === 'web') {
  SliderComponent = require('rc-slider').default;
  require('rc-slider/assets/index.css');
} else {
  SliderComponent = require('@react-native-community/slider').default;
}

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

const { width } = Dimensions.get('window');
const SETUP_STEPS = ['qualifications', 'specialization', 'bio', 'contact', 'experience'];

// Field validation requirements
const FIELD_REQUIREMENTS = {
  qualifications: { required: true, message: 'Please enter your qualifications' },
  specialization: { required: true, message: 'Please enter your specialization' },
  bio: { required: true, message: 'Please enter your bio' },
  phone: { required: true, message: 'Please enter your phone number' },
  address: { required: true, message: 'Please enter your address' },
  experience: { required: true, message: 'Please select your experience level' }
};

// Enhanced PlatformTextInput with proper web style handling
const PlatformTextInput = ({ 
  style = {}, 
  multiline = false, 
  numberOfLines = 1, 
  placeholderTextColor, 
  onChangeText,
  value,
  placeholder,
  inputMode,
  error,
  required,
  ...props 
}) => {
  if (Platform.OS === 'web') {
    const webStyles = {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      borderWidth: style.borderWidth || 1,
      borderRadius: style.borderRadius || 12,
      padding: style.padding || 16,
      fontSize: style.fontSize || 16,
      marginBottom: style.marginBottom || 16,
      borderStyle: 'solid',
      color: style.color || 'inherit',
      borderColor: error ? '#ff4444' : style.borderColor || '#ccc',
      backgroundColor: style.backgroundColor || 'transparent',
      outline: 'none',
      ...(multiline ? {
        height: numberOfLines ? `${numberOfLines * 24}px` : '120px',
        minHeight: '120px',
        resize: 'vertical'
      } : {}),
      '::placeholder': {
        color: placeholderTextColor || '#999'
      }
    };

    const handleChange = (e) => {
      if (onChangeText) {
        onChangeText(e.target.value);
      }
    };

    if (multiline) {
      return (
        <div style={{ width: '100%' }}>
          <textarea
            style={webStyles}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            rows={numberOfLines}
          />
          {error && <div style={styles.errorText}>{error}</div>}
        </div>
      );
    }
    
    return (
      <div style={{ width: '100%' }}>
        <input
          type={inputMode === 'tel' ? 'tel' : 'text'}
          style={webStyles}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
        {error && <div style={styles.errorText}>{error}</div>}
      </div>
    );
  }
  
  return (
    <View style={{ width: '100%' }}>
      <TextInput 
        style={[
          styles.input, 
          style,
          multiline && { height: 120, textAlignVertical: 'top' },
          error && { borderColor: '#ff4444' }
        ]}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={placeholderTextColor}
        onChangeText={onChangeText}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {required && !error && (
        <Text style={[styles.requiredText, { color: Colors[useColorScheme()?.textSecondary || 'light'].textSecondary }]}>
          * Required
        </Text>
      )}
    </View>
  );
};

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
    experience: 1
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  // Web file input ref
  const fileInputRef = useRef(null);

  // Initial entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Icon animation on step change
  useEffect(() => {
    iconAnim.setValue(0);
    Animated.sequence([
      Animated.spring(iconAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(iconAnim, {
        toValue: 0.95,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(iconAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const animateSlide = (direction: 'left' | 'right') => {
    slideAnim.setValue(direction === 'left' ? -50 : 50);
    fadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

const validateCurrentStep = () => {
  const currentStepKey = SETUP_STEPS[currentStep];
  const fieldRequirements = FIELD_REQUIREMENTS[currentStepKey];
  
  if (!fieldRequirements?.required) return true;

  let isValid = true;
  const newErrors = { ...errors };

  if (currentStepKey === 'profilePhoto') {
    if (!formData.profilePhoto) {
      newErrors.profilePhoto = fieldRequirements.message;
      isValid = false;
    } else {
      delete newErrors.profilePhoto;
    }
  } else if (currentStepKey === 'experience') {
    // Special handling for numeric experience field
    if (formData.experience === null || formData.experience === undefined) {
      newErrors.experience = 'Please select your experience level';
      isValid = false;
    } else {
      delete newErrors.experience;
    }
  } else {
    // Handle string fields
    if (!formData[currentStepKey]?.toString().trim()) {
      newErrors[currentStepKey] = fieldRequirements.message;
      isValid = false;
    } else {
      delete newErrors[currentStepKey];
    }
  }

  setErrors(newErrors);
  return isValid;
};



  const handleNext = () => {
    if (!validateCurrentStep()) return;

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

  const prepareFormData = () => {
    const formDataToSubmit = new FormData();
    const userId = AsyncStorage.getItem('user_id');
    
    userId.then(resolvedId => {
      const userIdInt = parseInt(resolvedId);
      formDataToSubmit.append('user_id', userIdInt);
      formDataToSubmit.append('qualifications', formData.qualifications);
      formDataToSubmit.append('specialization', formData.specialization);
      formDataToSubmit.append('bio', formData.bio);
      formDataToSubmit.append('phone', formData.phone);
      formDataToSubmit.append('address', formData.address);
      formDataToSubmit.append('experience', formData.experience.toString());
    });
    
    return formDataToSubmit;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId){
        router.push('/auth/');
        throw new Error('User ID not found. Please log in again.');
        return;
      } 

      // Validate all required fields
      const validationErrors = {};
      let hasErrors = false;

      Object.keys(FIELD_REQUIREMENTS).forEach(key => {
        if (FIELD_REQUIREMENTS[key].required) {
          if (!formData[key] || (typeof formData[key] === 'string' && !formData[key].trim())) {
            validationErrors[key] = FIELD_REQUIREMENTS[key].message;
            hasErrors = true;
          }
        }
      });

      if (hasErrors) {
        setErrors(validationErrors);
        setIsLoading(false);
        
        // Find the first step with error and go to it
        const errorStep = SETUP_STEPS.findIndex(step => validationErrors[step]);
        if (errorStep >= 0) {
          setCurrentStep(errorStep);
        }
        
        return;
      }

      const formDataToSubmit = prepareFormData();
      console.log(formDataToSubmit);
      
      const response = await axios.post(`${Config.apiBaseUrl}/teacher/setup`, formDataToSubmit, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      await AsyncStorage.setItem('teacher', JSON.stringify(response.data.teacher));
      router.push('/');
    } catch (error) {
      console.error('Submission error:', error);
      showAlert(
        'Error', 
        error.response?.data?.message || 'Failed to save setup information. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepContent = () => {
      const currentStepKey = SETUP_STEPS[currentStep];
      const isRequired = FIELD_REQUIREMENTS[currentStepKey]?.required;

      const withOpacity = (hex: string, alpha: number) => {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      switch(currentStepKey) {
        case 'qualifications':
          return (
            <>
              <Animated.View style={{ 
                transform: [{ scale: iconAnim }],
                marginBottom: 16,
              }}>
                <View style={[styles.iconCircle, { 
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }]}>
                  <Ionicons name="school-outline" size={56} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Qualifications
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                List your degrees, certifications, and credentials
              </Text>
              <BlurView
                intensity={Platform.OS === 'ios' ? 12 : 6}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.inputCard, {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.65)
                    : withOpacity(colors.card, 0.85),
                  borderColor: withOpacity(colors.border, 0.3),
                }]}
              >
                <PlatformTextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                  }]}
                  placeholder="PhD in Mathematics, Teaching Certificate..."
                  placeholderTextColor={withOpacity(colors.textSecondary, 0.6)}
                  value={formData.qualifications}
                  onChangeText={(text) => setFormData({...formData, qualifications: text})}
                  error={errors.qualifications}
                  required={isRequired}
                />
              </BlurView>
            </>
          );
        case 'specialization':
          return (
            <>
              <Animated.View style={{ 
                transform: [{ scale: iconAnim }],
                marginBottom: 16,
              }}>
                <View style={[styles.iconCircle, { 
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }]}>
                  <Ionicons name="ribbon-outline" size={56} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Specialization
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                What subjects or areas do you specialize in?
              </Text>
              <BlurView
                intensity={Platform.OS === 'ios' ? 12 : 6}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.inputCard, {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.65)
                    : withOpacity(colors.card, 0.85),
                  borderColor: withOpacity(colors.border, 0.3),
                }]}
              >
                <PlatformTextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                  }]}
                  placeholder="Mathematics, Physics, Elementary Education..."
                  placeholderTextColor={withOpacity(colors.textSecondary, 0.6)}
                  value={formData.specialization}
                  onChangeText={(text) => setFormData({...formData, specialization: text})}
                  error={errors.specialization}
                  required={isRequired}
                />
              </BlurView>
            </>
          );
        case 'bio':
          return (
            <>
              <Animated.View style={{ 
                transform: [{ scale: iconAnim }],
                marginBottom: 16,
              }}>
                <View style={[styles.iconCircle, { 
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }]}>
                  <Ionicons name="document-text-outline" size={56} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your Teaching Bio
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Describe your teaching philosophy and what makes you unique
              </Text>
              <BlurView
                intensity={Platform.OS === 'ios' ? 12 : 6}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.inputCard, {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.65)
                    : withOpacity(colors.card, 0.85),
                  borderColor: withOpacity(colors.border, 0.3),
                }]}
              >
                <PlatformTextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    minHeight: 120,
                  }]}
                  placeholder="I have 10 years experience teaching with a focus on..."
                  placeholderTextColor={withOpacity(colors.textSecondary, 0.6)}
                  multiline
                  numberOfLines={5}
                  value={formData.bio}
                  onChangeText={(text) => setFormData({...formData, bio: text})}
                  error={errors.bio}
                  required={isRequired}
                />
              </BlurView>
            </>
          );
        case 'contact':
          return (
            <>
              <Animated.View style={{ 
                transform: [{ scale: iconAnim }],
                marginBottom: 16,
              }}>
                <View style={[styles.iconCircle, { 
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }]}>
                  <Ionicons name="call-outline" size={56} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Contact Information
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                How can students reach you?
              </Text>
              <BlurView
                intensity={Platform.OS === 'ios' ? 12 : 6}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.inputCard, {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.65)
                    : withOpacity(colors.card, 0.85),
                  borderColor: withOpacity(colors.border, 0.3),
                }]}
              >
                <PlatformTextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                  }]}
                  placeholder="Phone number"
                  placeholderTextColor={withOpacity(colors.textSecondary, 0.6)}
                  inputMode="tel"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  error={errors.phone}
                  required={isRequired}
                />
                <PlatformTextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    marginTop: 12,
                  }]}
                  placeholder="Address (City, Country)"
                  placeholderTextColor={withOpacity(colors.textSecondary, 0.6)}
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                  error={errors.address}
                  required={isRequired}
                />
              </BlurView>
            </>
          );
       case 'experience':
          return (
            <>
              <Animated.View style={{ 
                transform: [{ scale: iconAnim }],
                marginBottom: 16,
              }}>
                <View style={[styles.iconCircle, { 
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }]}>
                  <Ionicons name="briefcase-outline" size={56} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Teaching Experience
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                How many years have you been teaching?
              </Text>
              <BlurView
                intensity={Platform.OS === 'ios' ? 12 : 6}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.inputCard, {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.65)
                    : withOpacity(colors.card, 0.85),
                  borderColor: withOpacity(colors.border, 0.3),
                  padding: 24,
                }]}
              >
                <View style={styles.sliderContainer}>
                  <View style={[styles.valueDisplay, {
                    backgroundColor: withOpacity(colors.primary, 0.1),
                  }]}>
                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                      {formData.experience}
                    </Text>
                    <Text style={[styles.sliderValueLabel, { color: colors.primary }]}>
                      {formData.experience === 1 ? 'year' : 'years'}
                    </Text>
                  </View>
                  {Platform.OS === 'web' ? (
                    <SliderComponent
                      min={0}
                      max={30}
                      step={1}
                      value={formData.experience}
                      onChange={(value) => setFormData({...formData, experience: value})}
                      trackStyle={{ backgroundColor: colors.primary }}
                      railStyle={{ backgroundColor: withOpacity(colors.border, 0.3) }}
                      handleStyle={{ 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      }}
                    />
                  ) : (
                    <SliderComponent
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={30}
                      step={1}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={withOpacity(colors.border, 0.3)}
                      thumbTintColor={colors.primary}
                      value={formData.experience}
                      onValueChange={(value) => setFormData({...formData, experience: value})}
                    />
                  )}
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>0</Text>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>5</Text>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>10</Text>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>15</Text>
                    <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>20+</Text>
                  </View>
                </View>
              </BlurView>
              {errors.experience && (
                <Text style={[styles.errorText, { textAlign: 'center' }]}>
                  {errors.experience}
                </Text>
              )}
            </>
          );

        default:
          return null;
      }
    };

    return (
      <Animated.View
        style={{
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
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
        <BlurView 
          intensity={Platform.OS === 'ios' ? 330 : 100} 
          style={StyleSheet.absoluteFill} 
          tint={colorScheme === 'dark' ? 'dark' : 'light'} 
        />
        
        {/* Header gradient overlay */}
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']
              : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']
          }
          style={styles.headerGradient}
        />
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Progress Header */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 20 : 10}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={[styles.progressHeader, {
                backgroundColor: colorScheme === 'dark'
                  ? 'rgba(0,0,0,0.3)'
                  : 'rgba(255,255,255,0.5)',
              }]}
            >
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Step {currentStep + 1} of {SETUP_STEPS.length}
              </Text>
              <View style={styles.progressContainer}>
                {SETUP_STEPS.map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.progressDot,
                      { 
                        backgroundColor: i === currentStep ? colors.primary : colors.border,
                        width: i === currentStep ? 32 : 8,
                        opacity: i <= currentStep ? 1 : 0.4,
                      }
                    ]}
                  />
                ))}
              </View>
            </BlurView>

            <View style={styles.contentContainer}>
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderStep()}
              </ScrollView>
            </View>

            {/* Button Container with gradient */}
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']
                  : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.9)']
              }
              style={styles.buttonGradient}
            >
              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity 
                    style={[styles.secondaryButton, { 
                      borderColor: colors.border,
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    }]}
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
                      {currentStep === SETUP_STEPS.length - 1 && (
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  progressHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepContainer: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? '100%' : undefined,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputCard: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? '100%' : undefined,
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 0,
    fontWeight: '500',
  },
  buttonGradient: {
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : Platform.OS === 'web' ? 0 : 20,
    marginBottom: Platform.OS === 'web' ? 100 : 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sliderContainer: {
    width: '100%',
    marginTop: 8,
  },
  valueDisplay: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  sliderValueLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  requiredText: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
});