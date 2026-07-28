import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  RefreshControl,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSchoolStore from '@/utils/stores/schoolStore';
import { useLanguage } from '@/contexts/LanguageContext';
import SkeletonLoader from '@/components/SkeletonLoader';

const { width } = Dimensions.get("window");

interface ExamSequence {
  school_id: number;
  id: number;
  name: string;
  term: number;
  academic_year: string;
  start_date: string;
  mark_entry_allowed: boolean;
  is_published: boolean;
}

export default function ExamSequencesScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const { activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const schoolId = activeSchool?.id?.toString() || '';
  const classId = params.class_id as string;
  const subjectId = params.subject_id as string;

  const [sequences, setSequences] = useState<ExamSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<ExamSequence | null>(null);

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fetchSequences = async () => {
    try {
      setLoading(true);
      if (!activeSchool) {
        throw new Error(language === 'fr' ? 'Aucune école sélectionnée' : 'No school selected');
      }

      const response = await fetch(`${Config.apiBaseUrl}/exam-sequences?school_id=${schoolId}`);
      const data = await response.json();
      
      if (data.success) {
        setSequences(data.data);
        setError(null);
      } else {
        setError(data.message || (language === 'fr' ? 'Échec du chargement' : 'Failed to fetch'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSequences();
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleSelectExam = (sequence: ExamSequence) => {
    if (!sequence.mark_entry_allowed) {
      setSelectedSequence(sequence);
    } else {
      router.push(`/marks/students?class_id=${classId}&school_id=${schoolId}&subject_id=${subjectId}&sequence_id=${sequence.id}`);
    }
  };

  const ExamCard = ({ item }: { item: ExamSequence }) => {
    const isOpen = item.mark_entry_allowed;
    const statusColor = isOpen ? '#10B981' : '#EF4444';
    
    return (
      <TouchableOpacity
        style={[styles.examCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}
        onPress={() => handleSelectExam(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[withOpacity('#6366F1', 0.2), withOpacity('#6366F1', 0.05)]}
          style={styles.iconContainer}
        >
          <Feather name="calendar" size={22} color="#6366F1" />
        </LinearGradient>
        
        <View style={styles.examInfo}>
          <Text style={[styles.examName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.examMeta, { color: colors.textSecondary }]}>
            {language === 'fr' ? 'Trimestre' : 'Term'} {item.term} • {item.academic_year}
          </Text>
          <Text style={[styles.examDate, { color: colors.textSecondary }]}>
            {language === 'fr' ? 'Début:' : 'Starts:'} {new Date(item.start_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: withOpacity(statusColor, 0.15) }]}>
            <Feather name={isOpen ? 'unlock' : 'lock'} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isOpen ? (language === 'fr' ? 'Ouvert' : 'Open') : (language === 'fr' ? 'Fermé' : 'Closed')}
            </Text>
          </View>
          
          <View style={[styles.chevronContainer, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: colors.text }]}>
        {language === 'fr' ? 'Séquences d\'examen' : 'Exam Sequences'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {language === 'fr' ? 'Sélectionnez une séquence pour saisir les notes' : 'Select a sequence to enter marks'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20 }}>
          <View style={styles.listContent}>
            <SkeletonLoader type="header" />
            <SkeletonLoader type="card" count={5} height={100} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchSequences}
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
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <FlatList
        data={sequences}
        renderItem={({ item }) => <ExamCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingTop: 16, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Aucune séquence disponible' : 'No sequences available'}
            </Text>
          </View>
        }
      />

      {/* Locked Exam Modal */}
      <Modal
        visible={selectedSequence !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSequence(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={[styles.modalContent, { backgroundColor: withOpacity(colors.card, 0.95) }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: withOpacity('#EF4444', 0.15) }]}>
              <Feather name="lock" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Saisie fermée' : 'Entry Closed'}
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {language === 'fr' 
                ? `La saisie des notes pour "${selectedSequence?.name}" est actuellement fermée. Contactez l'administrateur pour l'ouvrir.`
                : `Mark entry for "${selectedSequence?.name}" is currently closed. Contact administrator to open it.`
              }
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedSequence(null)}
            >
              <Text style={styles.modalButtonText}>
                {language === 'fr' ? 'Compris' : 'Got it'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  examCard: {
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
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  examMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  examDate: {
    fontSize: 13,
  },
  statusSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
