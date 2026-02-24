import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { handleLogout } from '@/utils/auth';
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import Config from '@/constants/Config';
import AsyncStorage from "@react-native-async-storage/async-storage";

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  action: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const { user, teacher } = useUserStore();
  const { activeSchool } = useSchoolStore();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = await AsyncStorage.getItem('token');
      // Call logout API
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

    await handleLogout();
  };

  const confirmLogout = () => {
    const title = language === 'fr' ? 'Déconnexion' : 'Logout';
    const message = language === 'fr' ? 'Êtes-vous sûr de vouloir vous déconnecter ?' : 'Are you sure you want to logout?';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
          {
            text: language === 'fr' ? 'Déconnexion' : 'Logout',
            style: 'destructive',
            onPress: performLogout,
          }
        ]
      );
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      language === 'fr' ? 'Notifications' : 'Notifications',
      language === 'fr' ? 'Les notifications arrivent bientôt' : 'Notifications coming soon',
      [{ text: 'OK' }]
    );
  };

  const settingsGroups = [
    {
      title: language === 'fr' ? 'COMPTE' : 'ACCOUNT',
      items: [
        {
          id: 'profile',
          icon: 'person-outline' as IconName,
          title: language === 'fr' ? 'Modifier le profil' : 'Edit Profile',
          subtitle: user?.email,
          action: () => router.push('/settings/edit-profile')
        },
        {
          id: 'security',
          icon: 'lock-closed-outline' as IconName,
          title: language === 'fr' ? 'Changer le mot de passe' : 'Change Password',
          subtitle: language === 'fr' ? 'Mettre à jour le mot de passe' : 'Update your password',
          action: () => router.push('/settings/change-password')
        }
      ]
    },
    {
      title: language === 'fr' ? 'PRÉFÉRENCES' : 'PREFERENCES',
      items: [
        {
          id: 'language',
          icon: 'language-outline' as IconName,
          title: language === 'fr' ? 'Langue' : 'Language',
          subtitle: language === 'en' ? 'English' : 'Français',
          action: handleLanguageToggle,
          rightElement: (
            <View style={[styles.languageToggle, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.languageText, { color: colors.primary }]}>
                {language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
              </Text>
            </View>
          )
        },
        {
          id: 'notifications',
          icon: 'notifications-outline' as IconName,
          title: 'Notifications',
          subtitle: language === 'fr' ? 'Gérer les notifications' : 'Manage notifications',
          action: handleNotifications
        }
      ]
    },
    {
      title: language === 'fr' ? 'SUPPORT' : 'SUPPORT',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline' as IconName,
          title: language === 'fr' ? 'Aide' : 'Help',
          subtitle: language === 'fr' ? 'FAQ et contact' : 'FAQ & Contact',
          action: () => router.push('/support/help')
        },
        {
          id: 'about',
          icon: 'information-circle-outline' as IconName,
          title: language === 'fr' ? 'À propos' : 'About',
          subtitle: `Version ${Config.appVersion || '1.0.0'}`,
          action: () => router.push('/support/about')
        }
      ]
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline' as IconName,
          title: language === 'fr' ? 'Déconnexion' : 'Logout',
          action: confirmLogout,
          danger: true
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: item.danger ? colors.error + '20' : colors.primary + '15' }
      ]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.danger ? colors.error : colors.primary} 
        />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[
          styles.itemTitle, 
          { color: item.danger ? colors.error : colors.text }
        ]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        )}
      </View>
      
      {item.rightElement || (
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.tint]}
        start={[0, 0]}
        end={[1, 1]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || (language === 'fr' ? 'Enseignant' : 'Teacher')}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {activeSchool && (
              <Text style={styles.profileSchool}>{activeSchool.name}</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsGroups.map((group, index) => (
          <View key={index} style={styles.settingsGroup}>
            {group.title ? (
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                {group.title}
              </Text>
            ) : null}
            <View style={[styles.groupContainer, { backgroundColor: colors.card }]}>
              {group.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < group.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {isLoggingOut && (
          <View style={styles.loggingOutOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loggingOutText, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Déconnexion...' : 'Logging out...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)'
  },
  profileSchool: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  settingsGroup: {
    marginBottom: 20
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4
  },
  groupContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  itemContent: {
    flex: 1
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 2
  },
  separator: {
    height: 1,
    marginLeft: 70
  },
  languageToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600'
  },
  loggingOutOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10
  },
  loggingOutText: {
    fontSize: 14
  }
});