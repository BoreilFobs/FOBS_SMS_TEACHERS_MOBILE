import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
  useColorScheme,
  Animated,
  Image,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from "@/contexts/LanguageContext";
import SchoolSwitcher from "@/components/SchoolSwitcher";
import SkeletonLoader from '@/components/SkeletonLoader';

const { width } = Dimensions.get("window");

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalSubjects: number;
  overallPassRate: number;
}

interface BestSubject {
  name: string;
  class: string;
  pass_rate: number;
  average: number;
}

interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  class_name: string;
  pass_rate: number;
  average: number;
  total_marks: number;
}

interface RecentActivity {
  id: number;
  type: 'marks' | 'attendance' | 'report';
  description: string;
  descriptionFr: string;
  time: string;
  color: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user, teacher, loadUserData } = useUserStore();
  const { activeSchool, schools } = useSchoolStore();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalSubjects: 0,
    overallPassRate: 0,
  });
  const [bestSubject, setBestSubject] = useState<BestSubject | null>(null);
  const [subjectPerformances, setSubjectPerformances] = useState<SubjectPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSchoolSwitcher, setShowSchoolSwitcher] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'fr' ? 'Bonjour' : 'Good Morning';
    if (hour < 17) return language === 'fr' ? 'Bon après-midi' : 'Good Afternoon';
    return language === 'fr' ? 'Bonsoir' : 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', options);
  };

  const fetchDashboardData = async () => {
    if (!activeSchool || !teacher) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.apiBaseUrl}/teacher/dashboard?school_id=${activeSchool.id}&teacher_id=${teacher.id}`
      );
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response text:', text.substring(0, 200));
        return;
      }
      
      if (data.success) {
        setStats({
          totalClasses: data.stats?.totalClasses || 0,
          totalStudents: data.stats?.totalStudents || 0,
          totalSubjects: data.stats?.totalSubjects || 0,
          overallPassRate: data.stats?.overallPassRate || 0,
        });
        setBestSubject(data.bestSubject || null);
        setSubjectPerformances(data.subjectPerformances || []);
        setRecentActivity(data.recentActivity || []);
      } else {
        console.error('API error:', data.message, data.error);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || !teacher) {
      loadUserData();
    }
  }, []);

  useEffect(() => {
    if (activeSchool && teacher) {
      fetchDashboardData();
    }
  }, [activeSchool, teacher]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const quickActions = [
    {
      id: 'reports',
      title: language === 'fr' ? 'Rapports' : 'Reports',
      icon: 'bar-chart-2',
      color: '#F59E0B',
      onPress: () => router.push('/reports'),
    },
    {
      id: 'marks',
      title: language === 'fr' ? 'Saisir Notes' : 'Enter Marks',
      icon: 'edit-3',
      color: '#3B82F6',
      onPress: () => router.push('/(tabs)/subjects'),
    },
    {
      id: 'attendance',
      title: language === 'fr' ? 'Présences' : 'Attendance',
      icon: 'check-square',
      color: '#10B981',
      onPress: () => router.push('/(tabs)/attendance'),
    },
    {
      id: 'classes',
      title: language === 'fr' ? 'Mes Classes' : 'My Classes',
      icon: 'users',
      color: '#8B5CF6',
      onPress: () => router.push('/(tabs)/attendance'),
    },
  ];

  const StatCard = ({ title, value, icon, color, suffix }: { title: string; value: number; icon: string; color: string; suffix?: string }) => (
    <View style={[styles.statCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
      <LinearGradient
        colors={[withOpacity(color, 0.2), withOpacity(color, 0.05)]}
        style={styles.statIconContainer}
      >
        <Feather name={icon as any} size={20} color={color} />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}{suffix || ''}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  const QuickActionCard = ({ action }: { action: typeof quickActions[0] }) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: withOpacity(action.color, 0.1) }]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
        <Feather name={action.icon as any} size={22} color="white" />
      </View>
      <Text style={[styles.quickActionText, { color: colors.text }]}>{action.title}</Text>
    </TouchableOpacity>
  );

  const ActivityItem = ({ item }: { item: RecentActivity }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityDot, { backgroundColor: item.color }]} />
      <Text style={[styles.activityText, { color: colors.text }]}>
        {language === 'fr' ? item.descriptionFr : item.description}
      </Text>
      <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{item.time}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 100}
        style={StyleSheet.absoluteFill}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name?.split(' ')[0] || 'Teacher'} 👋
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* School Switcher Button */}
          <TouchableOpacity
            style={[styles.schoolButton, { backgroundColor: withOpacity(colors.card, 0.9) }]}
            onPress={() => setShowSchoolSwitcher(true)}
            activeOpacity={0.7}
          >
            {activeSchool?.logo ? (
              <Image source={{ uri: activeSchool.logo }} style={styles.schoolLogo} />
            ) : (
              <View style={[styles.schoolLogoPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.schoolLogoText}>
                  {activeSchool?.name?.charAt(0) || 'S'}
                </Text>
              </View>
            )}
            <Feather name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: withOpacity(colors.card, 0.9) }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Feather name="settings" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Date Card */}
        <View style={[styles.dateCard, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.primary }]}>{getFormattedDate()}</Text>
        </View>

        {/* Active School Banner */}
        {activeSchool && (
          <TouchableOpacity
            style={[styles.schoolBanner, { backgroundColor: withOpacity(colors.card, 0.95) }]}
            onPress={() => setShowSchoolSwitcher(true)}
            activeOpacity={0.8}
          >
            <View style={styles.schoolBannerLeft}>
              {activeSchool.logo ? (
                <Image source={{ uri: activeSchool.logo }} style={styles.bannerLogo} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.tint]}
                  style={styles.bannerLogoPlaceholder}
                >
                  <Text style={styles.bannerLogoText}>{activeSchool.name.charAt(0)}</Text>
                </LinearGradient>
              )}
              <View style={styles.schoolBannerInfo}>
                <Text style={[styles.schoolBannerName, { color: colors.text }]} numberOfLines={1}>
                  {activeSchool.name}
                </Text>
                <Text style={[styles.schoolBannerCode, { color: colors.textSecondary }]}>
                  {activeSchool.code} • {activeSchool.academic_year || '2024-2025'}
                </Text>
              </View>
            </View>
            <View style={[styles.switchBadge, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
              <Feather name="repeat" size={14} color={colors.primary} />
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {language === 'fr' ? 'Changer' : 'Switch'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? "Vue d'ensemble" : 'Overview'}
          </Text>
          {loading ? (
            <View style={styles.statsGrid}>
              <SkeletonLoader type="stats" count={4} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                title={language === 'fr' ? 'Taux Réussite' : 'Pass Rate'}
                value={stats.overallPassRate}
                icon="trending-up"
                color="#8B5CF6"
                suffix="%"
              />
              <StatCard
                title={language === 'fr' ? 'Classes' : 'Classes'}
                value={stats.totalClasses}
                icon="book-open"
                color="#3B82F6"
              />
              <StatCard
                title={language === 'fr' ? 'Matières' : 'Subjects'}
                value={stats.totalSubjects}
                icon="layers"
                color="#F59E0B"
              />
              <StatCard
                title={language === 'fr' ? 'Moy. Générale' : 'Avg. Mark'}
                value={stats.overallPassRate > 0 ? Math.round(stats.overallPassRate / 5) : 0}
                icon="star"
                color="#10B981"
                suffix="/20"
              />
            </View>
          )}
        </View>

        {/* Best Performing Subject */}
        {loading ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Meilleure Performance' : 'Best Performance'}
            </Text>
            <SkeletonLoader type="card" height={120} />
          </View>
        ) : (
          bestSubject && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'fr' ? 'Meilleure Performance' : 'Best Performance'}
              </Text>
              <View style={[styles.bestSubjectCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bestSubjectGradient}
                >
                  <View style={styles.bestSubjectContent}>
                    <View style={styles.bestSubjectIconContainer}>
                      <Feather name="award" size={28} color="white" />
                    </View>
                    <View style={styles.bestSubjectInfo}>
                      <Text style={styles.bestSubjectName}>{bestSubject.name}</Text>
                      <Text style={styles.bestSubjectClass}>{bestSubject.class}</Text>
                    </View>
                    <View style={styles.bestSubjectStats}>
                      <Text style={styles.bestSubjectPassRate}>{bestSubject.pass_rate}%</Text>
                      <Text style={styles.bestSubjectLabel}>
                        {language === 'fr' ? 'Réussite' : 'Pass Rate'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Actions rapides' : 'Quick Actions'}
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Activité récente' : 'Recent Activity'}
          </Text>
          <View style={[styles.activityCard, { backgroundColor: withOpacity(colors.card, 0.8) }]}>
            {loading ? (
              <View style={{ padding: 8 }}>
                <SkeletonLoader type="text" count={4} height={14} style={{ marginBottom: 12 }} />
              </View>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="time-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyActivityText, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Aucune activité récente' : 'No recent activity'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* School Switcher Modal */}
      <SchoolSwitcher
        visible={showSchoolSwitcher}
        onClose={() => setShowSchoolSwitcher(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  schoolLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  schoolLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolLogoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 24,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  schoolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  schoolBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  bannerLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLogoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  schoolBannerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  schoolBannerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  schoolBannerCode: {
    fontSize: 13,
    marginTop: 2,
  },
  switchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 13,
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    padding: 16,
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyActivityText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bestSubjectCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bestSubjectGradient: {
    padding: 20,
  },
  bestSubjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestSubjectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bestSubjectInfo: {
    flex: 1,
  },
  bestSubjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  bestSubjectClass: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bestSubjectStats: {
    alignItems: 'center',
  },
  bestSubjectPassRate: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  bestSubjectLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
});
