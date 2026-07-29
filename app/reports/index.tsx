import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';
import useSchoolStore from '@/utils/stores/schoolStore';
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from "@/contexts/LanguageContext";
import SkeletonLoader from '@/components/SkeletonLoader';
import { authFetch } from '@/services/authFetch';

const { width } = Dimensions.get("window");

interface SequencePerformance {
  sequence_id: number;
  sequence_name: string;
  term: number;
  average: number;
  pass_rate: number;
  total_marks: number;
  highest: number;
  lowest: number;
}

interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  class_id: number;
  class_name: string;
  sequences: SequencePerformance[];
  overall: {
    average: number;
    pass_rate: number;
    total_students: number;
    marks_entered: number;
  };
}

interface ReportSummary {
  total_subjects: number;
  overall_average: number;
  overall_pass_rate: number;
  total_sequences: number;
}

export default function ReportsScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { teacher } = useUserStore();
  const { activeSchool } = useSchoolStore();
  
  const [performance, setPerformance] = useState<SubjectPerformance[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fetchPerformanceReport = async () => {
    if (!activeSchool || !teacher) return;
    
    try {
      setLoading(true);
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher/performance-report?school_id=${activeSchool.id}&teacher_id=${teacher.id}`
      );
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response text:', text.substring(0, 200));
        setPerformance([]);
        setSummary(null);
        return;
      }
      
      if (data.success) {
        setPerformance(data.data?.performance || []);
        setSummary(data.data?.summary || null);
      } else {
        console.error('API error:', data.message);
        // Still set empty data on API error
        setPerformance([]);
        setSummary(null);
      }
    } catch (err) {
      console.error('Report fetch error:', err);
      setPerformance([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (activeSchool && teacher) {
      fetchPerformanceReport();
    }
  }, [activeSchool, teacher]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPerformanceReport();
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 70) return '#10B981';
    if (value >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getGradeColor = (average: number) => {
    if (average >= 16) return '#10B981';
    if (average >= 14) return '#22C55E';
    if (average >= 12) return '#84CC16';
    if (average >= 10) return '#F59E0B';
    return '#EF4444';
  };

  const SummaryCard = () => (
    <View style={[styles.summaryCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
      <LinearGradient
        colors={[colors.primary, colors.tint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <Ionicons name="stats-chart" size={28} color="white" />
          <Text style={styles.summaryTitle}>
            {language === 'fr' ? 'Résumé Global' : 'Overall Summary'}
          </Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>
              {summary?.overall_average.toFixed(1) || '0'}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {language === 'fr' ? 'Moyenne' : 'Average'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>
              {summary?.overall_pass_rate.toFixed(0) || '0'}%
            </Text>
            <Text style={styles.summaryStatLabel}>
              {language === 'fr' ? 'Réussite' : 'Pass Rate'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>
              {summary?.total_subjects || '0'}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {language === 'fr' ? 'Matières' : 'Subjects'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const SubjectCard = ({ item, index }: { item: SubjectPerformance; index: number }) => {
    const isExpanded = expandedSubject === index;
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpandedSubject(isExpanded ? null : index)}
        style={[styles.subjectCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}
      >
        <View style={styles.subjectHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: withOpacity(getGradeColor(item.overall.average), 0.15) }]}>
            <Feather name="book" size={20} color={getGradeColor(item.overall.average)} />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: colors.text }]}>{item.subject_name}</Text>
            <Text style={[styles.className, { color: colors.textSecondary }]}>{item.class_name}</Text>
          </View>
          <View style={styles.subjectStats}>
            <Text style={[styles.avgValue, { color: getGradeColor(item.overall.average) }]}>
              {item.overall.average.toFixed(1)}
            </Text>
            <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'moy.' : 'avg'}
            </Text>
          </View>
          <Feather 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            {/* Overall Stats */}
            <View style={styles.overallStats}>
              <View style={styles.overallStatItem}>
                <Text style={[styles.overallStatValue, { color: getPerformanceColor(item.overall.pass_rate) }]}>
                  {item.overall.pass_rate.toFixed(0)}%
                </Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Réussite' : 'Pass Rate'}
                </Text>
              </View>
              <View style={styles.overallStatItem}>
                <Text style={[styles.overallStatValue, { color: colors.text }]}>
                  {item.overall.total_students}
                </Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Élèves' : 'Students'}
                </Text>
              </View>
              <View style={styles.overallStatItem}>
                <Text style={[styles.overallStatValue, { color: colors.text }]}>
                  {item.overall.marks_entered}
                </Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Notes' : 'Marks'}
                </Text>
              </View>
            </View>

            {/* Sequence Performance */}
            {item.sequences.length > 0 && (
              <>
                <Text style={[styles.sequencesTitle, { color: colors.text }]}>
                  {language === 'fr' ? 'Par Séquence' : 'By Sequence'}
                </Text>
                {item.sequences.map((seq, seqIndex) => (
                  <View key={seqIndex} style={[styles.sequenceRow, { backgroundColor: withOpacity(colors.background, 0.5) }]}>
                    <View style={styles.sequenceInfo}>
                      <Text style={[styles.sequenceName, { color: colors.text }]}>{seq.sequence_name}</Text>
                      <Text style={[styles.sequenceTerm, { color: colors.textSecondary }]}>
                        Term {seq.term}
                      </Text>
                    </View>
                    <View style={styles.sequenceStats}>
                      <View style={styles.sequenceStat}>
                        <Text style={[styles.sequenceValue, { color: getGradeColor(seq.average) }]}>
                          {seq.average.toFixed(1)}
                        </Text>
                        <Text style={[styles.sequenceLabel, { color: colors.textSecondary }]}>avg</Text>
                      </View>
                      <View style={styles.sequenceStat}>
                        <Text style={[styles.sequenceValue, { color: getPerformanceColor(seq.pass_rate) }]}>
                          {seq.pass_rate.toFixed(0)}%
                        </Text>
                        <Text style={[styles.sequenceLabel, { color: colors.textSecondary }]}>pass</Text>
                      </View>
                      <View style={styles.sequenceStat}>
                        <Text style={[styles.sequenceValue, { color: colors.text }]}>
                          {seq.highest}/{seq.lowest}
                        </Text>
                        <Text style={[styles.sequenceLabel, { color: colors.textSecondary }]}>H/L</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Rapports' : 'Reports'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonLoader type="card" height={140} style={{ marginBottom: 20 }} />
          <SkeletonLoader type="header" />
          <SkeletonLoader type="card" count={4} height={120} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Rapports de Performance' : 'Performance Reports'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Summary Card */}
        {summary && <SummaryCard />}

        {/* School Info */}
        <View style={[styles.schoolInfo, { backgroundColor: withOpacity(colors.card, 0.7) }]}>
          <Ionicons name="school-outline" size={20} color={colors.primary} />
          <Text style={[styles.schoolName, { color: colors.text }]}>
            {activeSchool?.name || (language === 'fr' ? 'Aucune école' : 'No school')}
          </Text>
        </View>

        {/* Performance by Subject */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Performance par Matière' : 'Performance by Subject'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {language === 'fr' ? 'Appuyez pour voir les détails' : 'Tap to view details'}
          </Text>
        </View>

        {performance.length > 0 ? (
          performance.map((item, index) => (
            <SubjectCard key={`${item.subject_id}-${item.class_id}`} item={item} index={index} />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: withOpacity(colors.card, 0.7) }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {language === 'fr' 
                ? 'Les rapports apparaîtront une fois les notes saisies' 
                : 'Reports will appear once marks are entered'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingRight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subjectCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  className: {
    fontSize: 12,
    marginTop: 2,
  },
  subjectStats: {
    alignItems: 'center',
    marginRight: 8,
  },
  avgValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  avgLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  overallStatItem: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  overallStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sequencesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceName: {
    fontSize: 13,
    fontWeight: '600',
  },
  sequenceTerm: {
    fontSize: 11,
  },
  sequenceStats: {
    flexDirection: 'row',
  },
  sequenceStat: {
    alignItems: 'center',
    marginLeft: 16,
  },
  sequenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sequenceLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
