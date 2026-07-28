import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Linking,
  Animated,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@webAppUpdateModalDismissed';

export default function WebAppUpdateModal() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? 'light'];
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Only show on web platform
    if (Platform.OS !== 'web') {
      setLoading(false);
      return;
    }

    checkShouldShow();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const checkShouldShow = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking modal status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleDontShowAgain = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      handleClose();
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleDownload = async () => {
    const downloadUrl = 'https://fobssms.com/app/FobsSMS Teachers.apk'; // Update with actual URL
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        console.error('Cannot open URL:', downloadUrl);
      }
    } catch (error) {
      console.error('Error opening download URL:', error);
    }
  };

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Don't render anything if not on web, loading, or not visible
  if (Platform.OS !== 'web' || loading || !visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 60 : 30}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.backdrop}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 100}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.modalContent,
              {
                backgroundColor:
                  colorScheme === 'dark'
                    ? withOpacity(colors.card, 0.9)
                    : withOpacity(colors.card, 0.98),
                borderColor:
                  colorScheme === 'dark'
                    ? withOpacity(colors.border, 0.3)
                    : withOpacity(colors.border, 0.5),
              },
            ]}
          >
            {/* Close Button */}
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>

            {/* Header with gradient */}
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']
                  : ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.02)']
              }
              style={styles.header}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="phone-android" size={56} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Major Updates Available!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enhanced User Interface
              </Text>
            </LinearGradient>

            {/* Content */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {/* Features List */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
                    <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Modern, beautiful interface
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
                    <MaterialIcons name="speed" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Faster performance
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
                    <MaterialIcons name="touch-app" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Improved user experience
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
                    <MaterialIcons name="notifications-active" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    Real-time notifications
                  </Text>
                </View>
              </View>

              {/* Platform Availability */}
              <View style={styles.platformContainer}>
                {/* Android Available */}
                <View style={[styles.platformCard, {
                  backgroundColor: withOpacity(colors.primary, 0.1),
                  borderColor: withOpacity(colors.primary, 0.3),
                }]}>
                  <MaterialIcons name="android" size={32} color={colors.primary} />
                  <Text style={[styles.platformTitle, { color: colors.text }]}>
                    Android App
                  </Text>
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>Available Now</Text>
                  </View>
                </View>

                {/* iOS Coming Soon */}
                <View style={[styles.platformCard, {
                  backgroundColor: withOpacity(colors.textSecondary, 0.05),
                  borderColor: withOpacity(colors.border, 0.3),
                }]}>
                  <Ionicons name="logo-apple" size={32} color={colors.textSecondary} />
                  <Text style={[styles.platformTitle, { color: colors.textSecondary }]}>
                    iOS App
                  </Text>
                  <View style={[styles.badge, { backgroundColor: colors.textSecondary }]}>
                    <Text style={styles.badgeText}>Coming Soon</Text>
                  </View>
                </View>
              </View>

              {/* Important Notice */}
              <View style={[styles.noticeBox, { 
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity('#f59e0b', 0.1) 
                  : withOpacity('#f59e0b', 0.08),
                borderColor: withOpacity('#f59e0b', 0.3),
              }]}>
                <MaterialIcons name="info-outline" size={20} color="#f59e0b" />
                <View style={styles.noticeContent}>
                  <Text style={[styles.noticeTitle, { color: colors.text }]}>
                    Password Reset Assistance
                  </Text>
                  <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                    For password reset issues, please contact{' '}
                    <Text style={[styles.phoneNumber, { color: colors.primary }]}>
                      671820738
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <Pressable
                onPress={handleDownload}
                style={({ pressed }) => [
                  styles.downloadButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <MaterialIcons name="download" size={24} color="#fff" />
                <Text style={styles.downloadButtonText}>Download Android App Now!</Text>
              </Pressable>

              <View style={styles.secondaryActions}>
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                    Remind Me Later
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDontShowAgain}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                    Don't Show Again
                  </Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom:300,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollView: {
    maxHeight: 400,
  },
  body: {
    padding: 24,
    paddingBottom:100,
    paddingTop: 8,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  platformContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  platformCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  platformTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noticeBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  noticeContent: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  phoneNumber: {
    fontWeight: '700',
    fontSize: 14,
  },
  actionContainer: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 300,
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
