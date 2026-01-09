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
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSchoolStore from '@/utils/stores/schoolStore';
import { useLanguage } from '@/contexts/LanguageContext';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}

export default function SchoolClassesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = activeSchool?.id?.toString() || '';

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
      const response = await fetch(`${Config.apiBaseUrl}/school-classes?school_id=${schoolId}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.classes);
        setError(null);
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
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  const getClassConfig = (className: string) => {
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
    }
    return { icon: 'users', color: '#64748B' };
  };

  const ClassCard = ({ item }: { item: Class }) => {
    const config = getClassConfig(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.classCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}
        onPress={() => router.push(`/attendance/students?class_id=${item.id}&school_id=${schoolId}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[withOpacity(config.color, 0.2), withOpacity(config.color, 0.05)]}
          style={styles.iconContainer}
        >
          <Feather name={config.icon as any} size={24} color={config.color} />
        </LinearGradient>
        
        <View style={styles.classInfo}>
          <Text style={[styles.className, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.classDetails, { color: colors.textSecondary }]}>
            {item.level} • {item.academic_year}
          </Text>
        </View>
        
        <View style={[styles.chevronContainer, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: colors.text }]}>
        {language === 'fr' ? 'Présences' : 'Attendance'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {classes.length} {language === 'fr' ? 'classe(s)' : 'class(es)'} • {language === 'fr' ? 'Sélectionner pour commencer' : 'Select to start'}
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
          <SkeletonLoader type="card" count={6} height={90} />
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
              onPress={fetchClasses}
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
        data={classes}
        renderItem={({ item }) => <ClassCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Aucune classe trouvée' : 'No classes found'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Les classes apparaîtront ici' : 'Classes will appear here'}
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
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
