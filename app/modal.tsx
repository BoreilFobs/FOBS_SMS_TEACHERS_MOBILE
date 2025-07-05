import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Text, View } from '@/components/Themed';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)']}
        style={styles.gradientContainer}
      >
        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Modal content */}
        <View style={styles.contentContainer}>
          <Feather 
            name="info" 
            size={48} 
            color={colors.primary} 
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Information
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This is a modal screen with important details
          </Text>
          
          <View 
            style={[
              styles.separator, 
              { backgroundColor: colors.border }
            ]} 
          />
          
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Here you can display additional information, settings, or any other content that requires focused attention.
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.secondaryButton,
              { borderColor: colors.border }
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary }
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientContainer: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    overflow: 'hidden',
    margin: Platform.OS === 'ios' ? 40 : 20,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 24,
    opacity: 0.2,
  },
  infoContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});