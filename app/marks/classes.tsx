import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useColorScheme,
  Animated,
  Easing,
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Class>);

interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}

export default function ClassSelectionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const blurTint: "light" | "dark" = (colorScheme === "light" ? "light" : "dark");
  const router = useRouter();
  const params = useLocalSearchParams();
  const { teacher } = useUserStore();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = params.schoolId as string;
  const teacherId = teacher?.id;
  const subjectId = params.subjectId as string;

  const shimmerColors = useMemo(
    () => ({
      base: colorScheme === "dark" ? "#1f2937" : "#e5e7eb",
      highlight: colorScheme === "dark" ? "#374151" : "#f3f4f6",
      border: colorScheme === "dark" ? "#334155" : "#e2e8f0",
    }),
    [colorScheme]
  );

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fetchClasses = async () => {
    
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.apiBaseUrl}/teacher-classes?school_id=${schoolId}&teacher_id=${teacherId}&subject_id=${subjectId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.data);
      } else {
        setError(data.message || 'Failed to fetch classes');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  useEffect(() => {
    if (schoolId && teacherId && subjectId) {
      fetchClasses();
    }
  }, [schoolId, teacherId, subjectId]);

  const ClassCard = ({ item, index }: { item: Class; index: number }) => {
    const classConfig = getClassConfig(item.name);
    const mountAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(mountAnim, {
        toValue: 1,
        delay: 40 * Math.min(index, 12),
        friction: 9,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, [mountAnim, index]);

    const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
    const translateY = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
    const opacity = mountAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });
    
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
        <Pressable
          android_ripple={{ color: withOpacity(colors.primary, 0.12), borderless: false }}
          style={styles.cardWrapper}
          onPressIn={() => {
            Animated.spring(pressAnim, {
              toValue: 1,
              useNativeDriver: true,
              friction: 6,
              tension: 100,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(pressAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 6,
              tension: 100,
            }).start();
          }}
          onPress={() => router.push(`/marks/exams?class_id=${item.id}&school_id=${schoolId}&subject_id=${subjectId}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 12 : 100}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.classCard,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity(colors.card, 0.65)
                  : withOpacity(colors.card, 0.85),
                borderColor: colorScheme === 'dark'
                  ? withOpacity(colors.border, 0.3)
                  : withOpacity(colors.border, 0.5),
              }
            ]}
          >
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? [withOpacity(classConfig.color, 0.25), withOpacity(classConfig.color, 0.08)]
                  : [withOpacity(classConfig.color, 0.2), withOpacity(classConfig.color, 0.06)]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Feather name={classConfig.icon} size={28} color={classConfig.color} />
            </LinearGradient>
            
            <View style={styles.textContainer}>
              <Text style={[styles.className, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.classDetails, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.level} • {item.academic_year}
              </Text>
            </View>
            
            <View 
              style={[
                styles.chevronPill,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.primary, 0.15)
                    : withOpacity(colors.primary, 0.1)
                }
              ]}
            >
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  };

  const renderClassCard = ({ item, index }: { item: Class; index: number }) => (
    <ClassCard item={item} index={index} />
  );

  const SkeletonCard = () => {
    const shimmer = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const loop = () => {
        shimmer.setValue(0);
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1400,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }).start(({ finished }) => finished && loop());
      };
      loop();
      return () => shimmer.stopAnimation();
    }, []);

    const translateX = shimmer.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [-CARD_WIDTH, CARD_WIDTH] 
    });

    return (
      <View style={styles.cardWrapper}>
        <View 
          style={[
            styles.classCard,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(shimmerColors.base, 0.5)
                : withOpacity(shimmerColors.base, 0.7),
              borderColor: shimmerColors.border,
            }
          ]}
        >
          <View 
            style={[
              styles.iconContainer,
              {
                backgroundColor: shimmerColors.highlight,
                opacity: 0.6,
              }
            ]}
          />
          
          <View style={styles.textContainer}>
            <View 
              style={{
                height: 18,
                borderRadius: 6,
                backgroundColor: shimmerColors.highlight,
                width: '85%',
                marginBottom: 8,
                opacity: 0.5,
              }}
            />
            <View 
              style={{
                height: 14,
                borderRadius: 6,
                backgroundColor: shimmerColors.highlight,
                width: '60%',
                opacity: 0.4,
              }}
            />
          </View>
          
          <Animated.View 
            pointerEvents="none" 
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: colorScheme === 'dark' ? 0.15 : 0.2,
                transform: [{ translateX }]
              }
            ]}
          >
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ["transparent", "rgba(255,255,255,0.25)", "transparent"]
                  : ["transparent", "rgba(255,255,255,0.45)", "transparent"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={blurTint} />
        <BlurView intensity={Platform.OS === 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={blurTint} />
        
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        
        <LinearGradient
          colors={[
            withOpacity(colors.primary, 0.18),
            withOpacity(colors.primary, 0.06),
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        />

        <View style={[styles.header, { paddingTop: 0 }]}>
          {/* <Text style={[styles.title, { color: colors.text }]}>Select Class</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Loading classes...
          </Text> */}
        </View>

        <View style={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </View>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={blurTint} />
        <BlurView intensity={Platform.OS === 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={blurTint} />
        
        <View style={[styles.container, styles.errorContainer]}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchClasses}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={blurTint} />
      <BlurView intensity={Platform.OS === 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={blurTint} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={[
          withOpacity(colors.primary, 0.18),
          withOpacity(colors.primary, 0.06),
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      />

      <View 
        style={[
          styles.header,
          {
            backgroundColor: withOpacity(colors.card, colorScheme === 'dark' ? 0.06 : 0.12),
            borderBottomColor: colors.border,
            paddingTop: 0,
          }
        ]}
      >
        <View>
          {/* <Text style={[styles.title, { color: colors.text }]}>Select Class</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose a class to continue
          </Text> */}
        </View>
      </View>

      <AnimatedFlatList
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        data={classes}
        renderItem={({ item, index }) => renderClassCard({ item, index })}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No classes assigned
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Contact your school administrator
            </Text>
          </View>
        }
      />
    </ImageBackground>
  );
}

// Helper function to get icon and color based on class
function getClassConfig(className: string): {
  icon: keyof typeof Feather.glyphMap;
  color: string;
} {
  const lowerName = className.toLowerCase();
  
  if (lowerName.includes('form 1') || lowerName.includes('grade 1')) {
    return { icon: 'users', color: '#6366F1' };
  } else if (lowerName.includes('form 2') || lowerName.includes('grade 2')) {
    return { icon: 'users', color: '#10B981' };
  } else if (lowerName.includes('form 3') || lowerName.includes('grade 3')) {
    return { icon: 'users', color: '#EF4444' };
  } else if (lowerName.includes('form 4') || lowerName.includes('grade 4')) {
    return { icon: 'users', color: '#F59E0B' };
  } else if (lowerName.includes('form 5') || lowerName.includes('grade 5')) {
    return { icon: 'award', color: '#8B5CF6' };
  } else if (lowerName.includes('form 6') || lowerName.includes('grade 6')) {
    return { icon: 'award', color: '#EC4899' };
  } else {
    return { icon: 'users', color: '#64748B' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 16,
  },
  classCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    minHeight: 160,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  textContainer: {
    flex: 1,
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  classDetails: {
    fontSize: 13,
    opacity: 0.75,
    fontWeight: '500',
  },
  chevronPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});