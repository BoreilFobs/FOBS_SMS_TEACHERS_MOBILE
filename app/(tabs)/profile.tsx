import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Config from '@/constants/Config';
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import { useLanguage } from '@/contexts/LanguageContext';
import SchoolSwitcher from '@/components/SchoolSwitcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  action: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { user, teacher, clearUserData } = useUserStore();
  const { activeSchool, schools, clearSchools } = useSchoolStore();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSchoolSwitcher, setShowSchoolSwitcher] = useState(false);

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const token = await AsyncStorage.getItem('auth_token');
              await fetch(`${Config.apiBaseUrl}/logout`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
            } catch (err) {
              console.error('Logout API error:', err);
            }
            
            await clearUserData();
            clearSchools();
            await AsyncStorage.removeItem('auth_token');
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const menuGroups = [
    {
      title: language === 'fr' ? 'École' : 'School',
      items: [
        {
          id: 'switch-school',
          icon: 'business-outline' as IconName,
          title: language === 'fr' ? "Changer d'école" : 'Switch School',
          subtitle: activeSchool?.name || (language === 'fr' ? 'Aucune école' : 'No school selected'),
          action: () => setShowSchoolSwitcher(true),
          rightElement: (
            <View style={[styles.badge, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{schools.length}</Text>
            </View>
          ),
        },
        {
          id: 'add-school',
          icon: 'add-circle-outline' as IconName,
          title: language === 'fr' ? 'Ajouter une école' : 'Add School',
          action: () => router.push('/schools/add'),
        },
      ],
    },
    {
      title: language === 'fr' ? 'Compte' : 'Account',
      items: [
        {
          id: 'profile',
          icon: 'person-outline' as IconName,
          title: language === 'fr' ? 'Modifier le profil' : 'Edit Profile',
          subtitle: user?.email,
          action: () => router.push('/settings/edit-profile'),
        },
        {
          id: 'security',
          icon: 'lock-closed-outline' as IconName,
          title: language === 'fr' ? 'Changer le mot de passe' : 'Change Password',
          action: () => router.push('/settings/change-password'),
        },
      ],
    },
    {
      title: language === 'fr' ? 'Préférences' : 'Preferences',
      items: [
        {
          id: 'language',
          icon: 'language-outline' as IconName,
          title: language === 'fr' ? 'Langue' : 'Language',
          subtitle: language === 'en' ? 'English' : 'Français',
          action: handleLanguageToggle,
          rightElement: (
            <View style={[styles.languageToggle, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
              <Text style={[styles.languageText, { color: colors.primary }]}>
                {language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
              </Text>
            </View>
          ),
        },
        {
          id: 'notifications',
          icon: 'notifications-outline' as IconName,
          title: language === 'fr' ? 'Notifications' : 'Notifications',
          action: () => Alert.alert(t('notifications'), language === 'fr' ? 'Bientôt disponible' : 'Coming soon'),
        },
      ],
    },
    {
      title: language === 'fr' ? 'Support' : 'Support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline' as IconName,
          title: language === 'fr' ? 'Aide & Support' : 'Help & Support',
          action: () => router.push('/support/help'),
        },
        {
          id: 'about',
          icon: 'information-circle-outline' as IconName,
          title: language === 'fr' ? 'À propos' : 'About',
          subtitle: `Version ${Config.appVersion}`,
          action: () => router.push('/support/about'),
        },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline' as IconName,
          title: t('logout'),
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: withOpacity(colors.card, 0.8) }]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIconContainer,
        { backgroundColor: item.danger ? withOpacity('#EF4444', 0.15) : withOpacity(colors.primary, 0.1) }
      ]}>
        <Ionicons
          name={item.icon}
          size={22}
          color={item.danger ? '#EF4444' : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: item.danger ? '#EF4444' : colors.text }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      {item.rightElement || (
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 100}
        style={StyleSheet.absoluteFill}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
          <View style={styles.profileHeader}>
            {teacher?.profile_photo ? (
              <Image source={{ uri: teacher.profile_photo }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.tint]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.name || 'Teacher'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || 'teacher@email.com'}
              </Text>
              {teacher?.specialization && (
                <View style={[styles.specializationBadge, { backgroundColor: withOpacity(colors.primary, 0.15) }]}>
                  <Text style={[styles.specializationText, { color: colors.primary }]}>
                    {teacher.specialization}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{schools.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Écoles' : 'Schools'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>--</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Classes' : 'Classes'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.menuGroup}>
            {group.title && (
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                {group.title}
              </Text>
            )}
            <View style={styles.menuList}>
              {group.items.map((item, index) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {index < group.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: withOpacity(colors.border, 0.3) }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            FobsSMS Teachers v{Config.appVersion}
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {language === 'fr' ? 'Fait avec ❤️ par Fobs' : 'Made with ❤️ by Fobs'}
          </Text>
        </View>
      </ScrollView>

      {/* School Switcher Modal */}
      <SchoolSwitcher
        visible={showSchoolSwitcher}
        onClose={() => setShowSchoolSwitcher(false)}
      />

      {/* Loading Overlay */}
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {language === 'fr' ? 'Déconnexion...' : 'Logging out...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 24,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  specializationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  menuGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  languageToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
