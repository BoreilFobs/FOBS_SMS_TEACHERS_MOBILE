import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Subject {
  id: number;
  name: string;
  code: string;
}

export default function SubjectsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { teacher } = useUserStore();
  const { activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = activeSchool?.id?.toString() || '';
  const teacherId = teacher?.id;

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.apiBaseUrl}/teacher-subjects?school_id=${schoolId}&teacher_id=${teacherId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch subjects');
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
    fetchSubjects();
  };

  useEffect(() => {
    if (schoolId && teacherId) {
      fetchSubjects();
    }
  }, [schoolId, teacherId]);

  const getSubjectConfig = (subjectName: string) => {
    const lowerName = subjectName.toLowerCase();
    if (lowerName.includes('math')) return { icon: 'hash', color: '#6366F1' };
    if (lowerName.includes('eng')) return { icon: 'book-open', color: '#10B981' };
    if (lowerName.includes('phy')) return { icon: 'aperture', color: '#EF4444' };
    if (lowerName.includes('chem')) return { icon: 'droplet', color: '#F59E0B' };
    if (lowerName.includes('bio')) return { icon: 'activity', color: '#8B5CF6' };
    if (lowerName.includes('hist')) return { icon: 'clock', color: '#EC4899' };
    if (lowerName.includes('geo')) return { icon: 'globe', color: '#14B8A6' };
    if (lowerName.includes('comp') || lowerName.includes('ict')) return { icon: 'cpu', color: '#3B82F6' };
    if (lowerName.includes('art')) return { icon: 'feather', color: '#F97316' };
    if (lowerName.includes('music')) return { icon: 'music', color: '#A855F7' };
    return { icon: 'book', color: '#64748B' };
  };

  const SubjectCard = ({ item }: { item: Subject }) => {
    const config = getSubjectConfig(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.subjectCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}
        onPress={() => router.push(`/marks/classes?subjectId=${item.id}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[withOpacity(config.color, 0.2), withOpacity(config.color, 0.05)]}
          style={styles.iconContainer}
        >
          <Feather name={config.icon as any} size={30} color={config.color} />
        </LinearGradient>
        
        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>
            {item.code}
          </Text>
        </View>
        
        <View style={[styles.chevronContainer, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
          <Feather name="chevron-right" size={22} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: colors.text }]}>
        {language === 'fr' ? 'Mes Matières' : 'My Subjects'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subjects.length} {language === 'fr' ? 'matière(s)' : 'subject(s)'} • {language === 'fr' ? 'Sélectionner pour les notes' : 'Select to enter marks'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 100 : 120} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <View style={styles.listContent}>
          <SkeletonLoader type="header" />
          <SkeletonLoader type="card" count={5} height={90} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 100 : 120} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchSubjects}
            >
              <Text style={styles.retryText}>
                {language === 'fr' ? 'Réessayer' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 100 : 120} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <FlatList
        data={subjects}
        renderItem={({ item }) => <SubjectCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Aucune matière assignée' : 'No subjects assigned'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Contactez votre administrateur' : 'Contact your administrator'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 6,
  },
  subjectCode: {
    fontSize: 15,
  },
  chevronContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
