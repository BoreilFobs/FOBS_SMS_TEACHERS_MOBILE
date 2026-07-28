import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import useSchoolStore, { School } from '@/utils/stores/schoolStore';
import useUserStore from '@/utils/stores/userStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import Config from '@/constants/Config';
import { getUserAndTeacherData } from '@/utils/storage/getUserAndTeacher';

const { width, height } = Dimensions.get('window');

interface SchoolSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export default function SchoolSwitcher({ visible, onClose }: SchoolSwitcherProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguage();
  const { teacher } = useUserStore();
  
  const { activeSchool, schools, setActiveSchool, setSchools, recentSchools } = useSchoolStore();
  
  const [loading, setLoading] = useState(false);
  const [fetchingSchools, setFetchingSchools] = useState(false);
  const [localSchools, setLocalSchools] = useState<School[]>([]);

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Use local schools if available, otherwise fall back to store
  const displaySchools = localSchools.length > 0 ? localSchools : schools;

  const fetchSchools = useCallback(async () => {
    try {
      setFetchingSchools(true);

      // Get teacher ID: try store first, then AsyncStorage
      let teacherId = useUserStore.getState().teacher?.id;
      if (!teacherId) {
        await useUserStore.getState().loadUserData();
        teacherId = useUserStore.getState().teacher?.id;
      }
      if (!teacherId) {
        console.warn('SchoolSwitcher: No teacher ID available');
        return;
      }

      const url = `${Config.apiBaseUrl}/teacher-schools?teacher_id=${teacherId}`;
      console.log('SchoolSwitcher: Fetching schools from', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('SchoolSwitcher: API response success:', data.success, 'items:', data.data?.length);

      if (data.success && Array.isArray(data.data)) {
        const approvedSchools: School[] = data.data
          .filter((item: any) => item.teacher_school?.isActive)
          .map((item: any) => ({
            id: item.school.id,
            name: item.school.name,
            code: item.school.acronym || item.school.code || '',
            logo: item.school.logo_url || undefined,
            address: item.school.address,
            phone: item.school.phone,
            email: item.school.email,
            status: 'active' as const,
            pivot: {
              is_approved: true,
              created_at: item.teacher_school.created_at,
            },
          }));

        console.log('SchoolSwitcher: Approved schools count:', approvedSchools.length);

        // Update both local state (for immediate display) and the global store
        setLocalSchools(approvedSchools);
        setSchools(approvedSchools);
      }
    } catch (err) {
      console.error('SchoolSwitcher: Error fetching schools:', err);
    } finally {
      setFetchingSchools(false);
    }
  }, [setSchools]);

  useEffect(() => {
    if (visible) {
      fetchSchools();
    }
  }, [visible, fetchSchools]);

  const handleSelectSchool = (school: School) => {
    setLoading(true);
    setActiveSchool(school);
    
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 300);
  };

  const handleAddSchool = () => {
    onClose();
    router.push('/schools/add');
  };

  const SchoolItem = ({ school, isActive }: { school: School; isActive: boolean }) => (
    <TouchableOpacity
      style={[
        styles.schoolItem,
        {
          backgroundColor: isActive
            ? withOpacity(colors.primary, 0.15)
            : withOpacity(colors.card, 0.8),
          borderColor: isActive ? colors.primary : 'transparent',
          borderWidth: isActive ? 2 : 0,
        },
      ]}
      onPress={() => handleSelectSchool(school)}
      activeOpacity={0.7}
    >
      {school.logo ? (
        <Image source={{ uri: school.logo }} style={styles.schoolItemLogo} />
      ) : (
        <LinearGradient
          colors={isActive ? [colors.primary, colors.tint] : ['#6B7280', '#9CA3AF']}
          style={styles.schoolItemLogoPlaceholder}
        >
          <Text style={styles.schoolItemLogoText}>{school.name.charAt(0)}</Text>
        </LinearGradient>
      )}
      
      <View style={styles.schoolItemInfo}>
        <Text style={[styles.schoolItemName, { color: colors.text }]} numberOfLines={1}>
          {school.name}
        </Text>
        <Text style={[styles.schoolItemCode, { color: colors.textSecondary }]}>
          {school.code}
        </Text>
      </View>
      
      {isActive && (
        <View style={[styles.activeCheck, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={14} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View
          style={[
            styles.container,
            {
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Changer d\'école' : 'Switch School'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Scrollable content area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {/* Current School */}
            {activeSchool && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'École actuelle' : 'Current School'}
                </Text>
                <View
                  style={[
                    styles.currentSchool,
                    { backgroundColor: withOpacity(colors.primary, 0.1) },
                  ]}
                >
                  {activeSchool.logo ? (
                    <Image source={{ uri: activeSchool.logo }} style={styles.currentSchoolLogo} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.tint]}
                      style={styles.currentSchoolLogoPlaceholder}
                    >
                      <Text style={styles.currentSchoolLogoText}>
                        {activeSchool.name.charAt(0)}
                      </Text>
                    </LinearGradient>
                  )}
                  <View style={styles.currentSchoolInfo}>
                    <Text style={[styles.currentSchoolName, { color: colors.text }]}>
                      {activeSchool.name}
                    </Text>
                    <Text style={[styles.currentSchoolDetails, { color: colors.textSecondary }]}>
                      {activeSchool.code} • {activeSchool.academic_year || '2024-2025'}
                    </Text>
                  </View>
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color="white" />
                  </View>
                </View>
              </View>
            )}

            {/* Recent Schools */}
            {recentSchools.length > 1 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Récent' : 'Recent'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentSchools
                    .filter(s => s.id !== activeSchool?.id)
                    .map((school) => (
                      <TouchableOpacity
                        key={school.id}
                        style={[styles.recentItem, { backgroundColor: withOpacity(colors.card, 0.8) }]}
                        onPress={() => handleSelectSchool(school)}
                      >
                        {school.logo ? (
                          <Image source={{ uri: school.logo }} style={styles.recentLogo} />
                        ) : (
                          <View style={[styles.recentLogoPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.recentLogoText}>{school.name.charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                          {school.name.split(' ').slice(0, 2).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* All Schools */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Toutes les écoles' : 'All Schools'}
              </Text>
              
              {fetchingSchools ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : displaySchools.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                    {language === 'fr' ? 'Aucune école trouvée' : 'No schools found'}
                  </Text>
                </View>
              ) : (
                displaySchools.map((school) => (
                  <SchoolItem
                    key={school.id}
                    school={school}
                    isActive={activeSchool?.id === school.id}
                  />
                ))
              )}
            </View>
          </ScrollView>

          {/* Add School Button */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddSchool}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.addButtonText}>
              {language === 'fr' ? 'Ajouter une école' : 'Add School'}
            </Text>
          </TouchableOpacity>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {language === 'fr' ? 'Changement...' : 'Switching...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  currentSchool: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  currentSchoolLogo: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  currentSchoolLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentSchoolLogoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  currentSchoolInfo: {
    flex: 1,
    marginLeft: 14,
  },
  currentSchoolName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentSchoolDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 12,
    width: 90,
  },
  recentLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentLogoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  recentName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  schoolItemLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  schoolItemLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolItemLogoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  schoolItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  schoolItemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  schoolItemCode: {
    fontSize: 13,
    marginTop: 2,
  },
  activeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
