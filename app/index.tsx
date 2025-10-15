import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Animated,
  Easing
} from "react-native";
import { Feather, FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSchools } from "@/hooks/useSchools";
import useUserStore from '@/utils/stores/userStore';
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 160;

export default function SchoolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const { user, teacher, loadUserData } = useUserStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  if (!teacher || !user) {
    loadUserData();
  }

  const { schoolData, loading, error, refetch } = useSchools(teacher?.id);

  // Entrance animations
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const AnimatedSchoolCard = ({ item, index }: { item: typeof schoolData[0]; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            { scale: pressAnim },
          ],
        }}
      >
        <TouchableOpacity
          style={[styles.schoolCard, { backgroundColor: colorScheme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.95)' }]}
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => router.push(`/(tabs)/subjects?schoolId=${item.school.id}`)}
        >
          <LinearGradient
            colors={colorScheme === 'dark' 
              ? ['rgba(100, 181, 246, 0.1)', 'transparent']
              : ['rgba(100, 181, 246, 0.05)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.schoolContent}>
            <View style={[
              styles.schoolLogoContainer,
              { 
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(100, 181, 246, 0.15)' 
                  : 'rgba(100, 181, 246, 0.1)',
                borderWidth: 2,
                borderColor: colorScheme === 'dark'
                  ? 'rgba(100, 181, 246, 0.3)'
                  : 'rgba(100, 181, 246, 0.2)',
              }
            ]}>
              {item.school.logo_url ? (
                <ImageBackground
                  source={{ uri: item.school.logo_url }}
                  style={styles.schoolLogo}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="school" size={40} color={colors.primary} />
              )}
            </View>
            
            <View style={styles.schoolInfo}>
              <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1}>
                {item.school.name}
              </Text>
              <Text style={[styles.schoolAcronym, { color: colors.textSecondary }]}>
                {item.school.acronym}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              {!item.teacher_school.isActive ? (
                <LinearGradient
                  colors={['#FFF3E0', '#FFE0B2']}
                  style={styles.statusBadge}
                >
                  <MaterialIcons name="pending" size={14} color="#E65100" />
                  <Text style={[styles.statusText, { color: '#E65100' }]}>Pending</Text>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.statusBadge}
                >
                  <Feather name="check-circle" size={14} color="#2E7D32" />
                  <Text style={[styles.statusText, { color: '#2E7D32' }]}>Active</Text>
                </LinearGradient>
              )}
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />
          
          <View style={styles.footer}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="map-pin" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.school.address || 'No location specified'}
              </Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: colorScheme === 'dark' ? 'rgba(100, 181, 246, 0.2)' : 'rgba(100, 181, 246, 0.1)' }]}>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSchoolItem = ({ item, index }: { item: typeof schoolData[0]; index: number }) => (
    <AnimatedSchoolCard item={item} index={index} />
  );

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <View style={[styles.container, styles.errorContainer]}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={refetch}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
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
      <BlurView 
        intensity={colorScheme === 'dark' ? 80 : 40} 
        style={StyleSheet.absoluteFill} 
        tint={colorScheme || 'dark'} 
      />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Schools</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your connected institutions
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              { 
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderColor: colorScheme === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
            onPress={() => router.push("settings")}
            activeOpacity={0.7}
          >
            <FontAwesome name="gear" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton]}
            onPress={() => router.push("/schools/add")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#64B5F6', '#42A5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Feather name="plus" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          { flex: 1 },
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <FlatList
          data={schoolData}
          renderItem={renderSchoolItem}
          keyExtractor={(item) => item.school.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <Animated.View 
              style={[
                styles.infoBanner,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(100, 181, 246, 0.15)'
                    : 'rgba(100, 181, 246, 0.1)',
                  borderWidth: 1,
                  borderColor: colorScheme === 'dark'
                    ? 'rgba(100, 181, 246, 0.3)'
                    : 'rgba(100, 181, 246, 0.2)',
                },
              ]}
            >
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Schools not appearing? Wait for the school to accept request or send request to a school.
              </Text>
            </Animated.View>
          }
          ListEmptyComponent={
            <Animated.View 
              style={[
                styles.emptyState,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[
                styles.emptyIconContainer,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(100, 181, 246, 0.1)'
                    : 'rgba(100, 181, 246, 0.08)',
                }
              ]}>
                <Ionicons name="school-outline" size={64} color={colors.primary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No schools connected
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Connect to a school to start managing your classes
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push("/schools/add")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#64B5F6', '#42A5F5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientAddButton}
                >
                  <Feather name="plus-circle" size={20} color="white" />
                  <Text style={styles.addButtonText}>Connect School</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          }
        />
      </Animated.View>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  schoolCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  schoolContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  schoolLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  schoolAcronym: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  addButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#42A5F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});