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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Config from '@/constants/Config';

interface UpdateResponse {
  success: boolean;
  update_available: boolean;
  version: string;
  message: string;
  download_url: string | null;
  checked_at: string;
}

interface UpdateModalProps {
  onUpdateChecked?: (updateAvailable: boolean) => void;
}

export default function UpdateModal({ onUpdateChecked }: UpdateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [updateInfo, setUpdateInfo] = useState<UpdateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  const currentVersion = Config.appVersion;

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (updateInfo?.update_available) {
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
  }, [updateInfo]);

  const checkForUpdates = async () => {
    try {
      const response = await fetch(`${Config.apiBaseUrl}/app/check-update`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: UpdateResponse = await response.json();
      setUpdateInfo(data);
      setLoading(false);

      // Notify parent component
      if (onUpdateChecked) {
        onUpdateChecked(data.update_available);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setLoading(false);
      // On error, assume no update to avoid blocking the app
      if (onUpdateChecked) {
        onUpdateChecked(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!updateInfo?.download_url) return;

    setDownloading(true);
    try {
      const supported = await Linking.canOpenURL(updateInfo.download_url);
      if (supported) {
        await Linking.openURL(updateInfo.download_url);
      } else {
        console.error('Cannot open URL:', updateInfo.download_url);
      }
    } catch (error) {
      console.error('Error opening download URL:', error);
    } finally {
      setDownloading(false);
    }
  };

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Don't show modal if loading or no update available
  if (loading || !updateInfo?.update_available) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      statusBarTranslucent
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
                    ? withOpacity(colors.card, 0.85)
                    : withOpacity(colors.card, 0.95),
                borderColor:
                  colorScheme === 'dark'
                    ? withOpacity(colors.border, 0.3)
                    : withOpacity(colors.border, 0.5),
              },
            ]}
          >
            {/* Header with gradient */}
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']
                  : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.02)']
              }
              style={styles.header}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="system-update" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Update Available
              </Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.body}>
              <View style={styles.versionContainer}>
                <View style={styles.versionBox}>
                  <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                    Current Version
                  </Text>
                  <Text style={[styles.versionText, { color: colors.text }]}>
                    {currentVersion}
                  </Text>
                </View>
                
                <MaterialIcons 
                  name="arrow-forward" 
                  size={24} 
                  color={colors.textSecondary} 
                  style={styles.arrowIcon}
                />
                
                <View style={styles.versionBox}>
                  <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                    New Version
                  </Text>
                  <Text style={[styles.versionText, { color: colors.primary }]}>
                    {updateInfo.version}
                  </Text>
                </View>
              </View>

              <Text style={[styles.message, { color: colors.text }]}>
                {updateInfo.message}
              </Text>

              <View style={[styles.infoBox, { 
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity(colors.primary, 0.1) 
                  : withOpacity(colors.primary, 0.05),
                borderColor: withOpacity(colors.primary, 0.2),
              }]}>
                <MaterialIcons name="info-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  You must update to continue using the app
                </Text>
              </View>
            </View>

            {/* Download Button */}
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
              style={({ pressed }) => [
                styles.downloadButton,
                {
                  opacity: pressed ? 0.8 : 1,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="download" size={24} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download Update</Text>
                </>
              )}
            </Pressable>
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
    maxWidth: 400,
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
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    padding: 24,
    paddingTop: 8,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  versionBox: {
    flex: 1,
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 20,
    fontWeight: '700',
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    margin: 24,
    marginTop: 0,
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
});
