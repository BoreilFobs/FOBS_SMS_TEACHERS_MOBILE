import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
  useColorScheme,
  Animated,
  Easing,
  FlatList,
} from "react-native";
import { Feather, FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSchools } from "@/hooks/useSchools";
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SchoolResponse } from "@/hooks/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<SchoolResponse>);

export default function SchoolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const blurTint: "light" | "dark" = (colorScheme === "light" ? "light" : "dark");
  const router = useRouter();
  const { user, teacher, loadUserData } = useUserStore();
  const { setActiveSchool, setSchools, activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Auto-redirect to home if school is already selected
  useEffect(() => {
    if (activeSchool) {
      router.replace('/(tabs)/home');
    }
  }, [activeSchool]);

  if (!teacher || !user) {
    loadUserData();
  }

  const { schoolData, loading, error, refetch } = useSchools();

  // Update school store when schoolData loads
  useEffect(() => {
    if (schoolData && schoolData.length > 0) {
      // Convert SchoolResponse to School format for the store
      const schools = schoolData.map((item) => ({
        id: item.school.id,
        name: item.school.name,
        code: item.school.acronym || item.school.code || '',
        logo: item.school.logo_url || undefined,
        address: item.school.address,
        phone: item.school.phone,
        email: item.school.email,
        status: 'active' as const,
        pivot: {
          is_approved: !!item.teacher_school.isActive,
          created_at: item.teacher_school.created_at,
        },
      }));
      setSchools(schools);
      
      // If no active school selected, auto-select the first active one
      if (!activeSchool && schools.length > 0) {
        const firstActive = schools.find(s => s.pivot?.is_approved);
        if (firstActive) {
          setActiveSchool(firstActive);
        }
      }
    }
  }, [schoolData]);

  // Handle school selection
  const handleSchoolSelect = (item: SchoolResponse) => {
    const school = {
      id: item.school.id,
      name: item.school.name,
      code: item.school.acronym || item.school.code || '',
      logo: item.school.logo_url || undefined,
      address: item.school.address,
      phone: item.school.phone,
      email: item.school.email,
      status: 'active' as const,
      pivot: {
        is_approved: !!item.teacher_school.isActive,
        created_at: item.teacher_school.created_at,
      },
    };
    setActiveSchool(school);
    // Navigate to home tab instead of subjects
    router.push('/(tabs)/home');
  };

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

  const StatusBadge = ({ active }: { active: boolean }) => (
    <BlurView
      intensity={Platform.OS === 'ios' ? 20 : 0}
      tint={colorScheme === 'dark' ? 'dark' : 'light'}
      style={[
        styles.statusBadge,
        {
          backgroundColor: active 
            ? (colorScheme === 'dark' 
                ? withOpacity(colors.success, 0.2) 
                : withOpacity(colors.success, 0.15))
            : (colorScheme === 'dark' 
                ? withOpacity(colors.warning, 0.2) 
                : withOpacity(colors.warning, 0.15)),
        },
      ]}
    >
      {active ? (
        <Feather name="check-circle" size={14} color={colors.success} />
      ) : (
        <MaterialIcons name="pending" size={16} color={colors.warning} />
      )}
      <Text style={[styles.statusText, { color: active ? colors.success : colors.warning }]}>
        {active ? 'Active' : 'Pending'}
      </Text>
    </BlurView>
  );

  const SchoolCard = ({ item, index }: { item: SchoolResponse; index: number }) => {
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
          onPress={() => handleSchoolSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.school.name}`}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 12 : 100}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.schoolCard,
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
            {/* Banner header with gradient */}
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? [withOpacity(colors.primary, 0.18), withOpacity(colors.primary, 0.06)]
                  : [withOpacity(colors.primary, 0.15), withOpacity(colors.primary, 0.05)]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            />
            
            {/* Status badge in banner */}
            <View style={styles.statusBadgeAbsolute}>
              <StatusBadge active={!!item.teacher_school.isActive} />
            </View>

            {/* Floating avatar with subtle shadow */}
            <View 
              style={[
                styles.avatarContainer,
                {
                  borderColor: colorScheme === 'dark'
                    ? withOpacity(colors.border, 0.4)
                    : withOpacity(colors.border, 0.6),
                  backgroundColor: colorScheme === 'dark'
                    ? withOpacity(colors.primary, 0.08)
                    : withOpacity(colors.primary, 0.06),
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }
              ]}
            > 
              {item.school.logo_url ? (
                <ImageBackground
                  source={{ uri: item.school.logo_url }}
                  style={styles.avatarImage}
                  imageStyle={{ borderRadius: 28 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="school" size={26} color={colors.primary} />
              )}
            </View>

            {/* Content */}
            <View style={styles.contentBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.schoolName, { color: colors.text, flex: 1 }]} numberOfLines={2}>
                  {item.school.name}
                </Text>
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
              </View>
              
              {!!item.school.acronym && (
                <Text style={[styles.schoolAcronym, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.school.acronym}
                </Text>
              )}
              
              <View style={styles.addressRow}>
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color={colors.textSecondary} 
                  style={styles.locationIcon}
                />
                <Text 
                  style={[
                    styles.footerText,
                    {
                      color: colors.textSecondary,
                      flex: 1,
                    }
                  ]}
                  numberOfLines={2}
                >
                  {item.school.address || 'No location specified'}
                </Text>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  };

  const renderSchoolItem = ({ item, index }: { item: SchoolResponse; index: number }) => (
    <SchoolCard item={item} index={index} />
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
    }, [shimmer]);

    const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-CARD_WIDTH, CARD_WIDTH] });

    return (
      <View style={styles.cardWrapper}>
        <View 
          style={[
            styles.schoolCard,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(shimmerColors.base, 0.5)
                : withOpacity(shimmerColors.base, 0.7),
              borderColor: shimmerColors.border,
            }
          ]}
        > 
          {/* Banner placeholder */}
          <View 
            style={[
              styles.banner,
              {
                backgroundColor: colorScheme === 'dark'
                  ? withOpacity(shimmerColors.highlight, 0.4)
                  : withOpacity(shimmerColors.highlight, 0.5)
              }
            ]}
          />
          {/* Status placeholder */}
          <View 
            style={[
              styles.statusBadgeAbsolute,
              {
                width: 76,
                height: 24,
                borderRadius: 14,
                backgroundColor: shimmerColors.highlight,
                opacity: 0.5,
              }
            ]}
          />
          {/* Avatar placeholder */}
          <View 
            style={[
              styles.avatarContainer,
              {
                backgroundColor: shimmerColors.highlight,
                borderColor: shimmerColors.border,
                opacity: 0.6,
              }
            ]}
          />
          {/* Content placeholders */}
          <View style={styles.contentBlock}>
            <View 
              style={{
                height: 20,
                borderRadius: 8,
                backgroundColor: shimmerColors.highlight,
                width: '75%',
                marginBottom: 8,
                opacity: 0.5,
              }}
            />
            <View 
              style={{
                height: 15,
                borderRadius: 6,
                backgroundColor: shimmerColors.highlight,
                width: '38%',
                marginBottom: 12,
                opacity: 0.4,
              }}
            />
            <View 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <View 
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: shimmerColors.highlight,
                  opacity: 0.4,
                }}
              />
              <View 
                style={{
                  height: 14,
                  borderRadius: 6,
                  backgroundColor: shimmerColors.highlight,
                  flex: 1,
                  opacity: 0.4,
                }}
              />
            </View>
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

  if (error) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={blurTint} />
        <View style={[styles.container, styles.errorContainer]}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={refetch}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  return (
    <AuthWrapper>
      <SetupWrapper>
        <ImageBackground
          source={require("@/assets/images/auth-bg2.jpg")}
          style={styles.container}
          blurRadius={10}
        >
          <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={blurTint} />
          <BlurView intensity={Platform.OS == 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={blurTint} />

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

          <Animated.View
            style={[
              styles.header,
              {
                backgroundColor: withOpacity(colors.card, colorScheme === 'dark' ? 0.06 : 0.12),
                borderBottomColor: colors.border,
                paddingTop: insets.top + 18,
              },
            ]}
          >
            <View>
              <Text style={[styles.title, { color: colors.text }]}>My Schools</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your connected institutions</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                android_ripple={{ color: withOpacity(colors.primary, 0.2), borderless: true }}
                style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push("settings")}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <FontAwesome name="gear" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                android_ripple={{ color: withOpacity('#ffffff', 0.2), borderless: true }}
                style={[styles.iconButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/schools/add")}
                accessibilityRole="button"
                accessibilityLabel="Add a school"
              >
                <Feather name="plus" size={20} color="white" />
              </Pressable>
            </View>
          </Animated.View>

          {loading ? (
            <View style={{ paddingHorizontal: 20 }}>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </View>
          ) : (
            <AnimatedFlatList
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              data={schoolData ?? []}
              renderItem={renderSchoolItem}
              keyExtractor={(item) => item.school.id?.toString?.() ?? Math.random().toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
              ListHeaderComponent={
                <View style={[styles.infoBanner, { backgroundColor: withOpacity(colors.primary, 0.08), borderColor: colors.border }]}> 
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>Schools not appearing? Wait for the school to accept request or send request to a school.</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="school" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No schools connected to your account</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add a school to get started</Text>
                  <Pressable
                    android_ripple={{ color: withOpacity('#ffffff', 0.2) }}
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push("/schools/add")}
                  >
                    <Text style={styles.addButtonText}>Connect School</Text>
                  </Pressable>
                </View>
              }
            />
          )}
        </ImageBackground>
      </SetupWrapper>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  schoolCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: {
    height: 72,
    width: '100%',
  },
  avatarContainer: {
    position: 'absolute',
    top: 44,
    left: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  contentBlock: {
    marginTop: 28,
    paddingHorizontal: 18,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  schoolAcronym: {
    fontSize: 14,
    opacity: 0.75,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  locationIcon: {
    marginTop: 2,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  chevronPill: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: -2,
  },
  emptyState: {
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
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
});