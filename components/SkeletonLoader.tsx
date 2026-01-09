import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'stats' | 'header' | 'text';
  count?: number;
  height?: number;
  width?: number | string;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 1,
  height = 80,
  width = '100%',
  style 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderCard = () => (
    <Animated.View 
      style={[
        styles.card, 
        { 
          backgroundColor: withOpacity(colors.card, 0.5),
          opacity,
          height,
          width,
        },
        style
      ]}
    >
      <View style={styles.cardContent}>
        <View style={[styles.icon, { backgroundColor: withOpacity(colors.textSecondary, 0.2) }]} />
        <View style={styles.textContainer}>
          <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.3), width: '70%' }]} />
          <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.2), width: '50%', marginTop: 8 }]} />
        </View>
        <View style={[styles.chevron, { backgroundColor: withOpacity(colors.textSecondary, 0.2) }]} />
      </View>
    </Animated.View>
  );

  const renderList = () => (
    <Animated.View 
      style={[
        styles.listItem,
        { 
          backgroundColor: withOpacity(colors.card, 0.5),
          opacity,
          height,
          width,
        },
        style
      ]}
    >
      <View style={styles.listContent}>
        <View style={[styles.listIcon, { backgroundColor: withOpacity(colors.textSecondary, 0.2) }]} />
        <View style={styles.listTextContainer}>
          <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.3), width: '60%' }]} />
          <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.2), width: '40%', marginTop: 6 }]} />
        </View>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View 
      style={[
        styles.statCard,
        { 
          backgroundColor: withOpacity(colors.card, 0.5),
          opacity,
        },
        style
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: withOpacity(colors.textSecondary, 0.2) }]} />
      <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.3), width: '60%', marginTop: 12 }]} />
      <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.2), width: '40%', marginTop: 8 }]} />
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity }, style]}>
      <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.3), width: '70%', height: 32 }]} />
      <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.2), width: '50%', height: 16, marginTop: 8 }]} />
    </Animated.View>
  );

  const renderText = () => {
    const widthStyle = typeof width === 'string' ? { width: width as any } : { width };
    return (
      <Animated.View style={[styles.textSkeleton, { opacity }, style]}>
        <View style={[styles.textLine, { backgroundColor: withOpacity(colors.textSecondary, 0.3), height: height || 16 }, widthStyle]} />
      </Animated.View>
    );
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCard();
      case 'list':
        return renderList();
      case 'stats':
        return renderStats();
      case 'header':
        return renderHeader();
      case 'text':
        return renderText();
      default:
        return renderCard();
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          {renderSkeleton()}
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  textLine: {
    height: 14,
    borderRadius: 8,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  listItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  listTextContainer: {
    flex: 1,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  header: {
    marginBottom: 20,
  },
  textSkeleton: {
    marginBottom: 8,
  },
});

export default SkeletonLoader;
