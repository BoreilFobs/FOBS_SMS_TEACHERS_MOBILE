// components/CustomHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, useTheme } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const CustomHeader = ({ options }: any) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <BlurView
      intensity={30}
      tint={theme.dark ? 'dark' : 'light'}
      style={styles.container}
    >
      <View style={styles.content}>
        {options.headerBack && (
          <Pressable
            hitSlop={8}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={options.headerTintColor || theme.colors.primary}
            />
          </Pressable>
        )}
        <Text style={[styles.title, { color: options.headerTintColor || theme.colors.text }]}>
          {options.title || ' '}
        </Text>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40, // Adjust for status bar
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
});