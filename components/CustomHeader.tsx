// components/CustomHeader.tsx
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useTheme } from '@react-navigation/native';

export const CustomHeader = ({ options }: any) => {
  const theme = useTheme();
  
  return (
    <BlurView 
      intensity={30}
      tint={theme.dark ? 'dark' : 'light'}
      style={styles.container}
    >
      <View style={styles.content}>
        {options.headerBack && (
          <HeaderBackButton
            tintColor={options.headerTintColor || theme.colors.primary}
            onPress={() => navigation.goBack()}
          />
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