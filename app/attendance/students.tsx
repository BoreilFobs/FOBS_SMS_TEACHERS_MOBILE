import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
  RefreshControl,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSchoolStore from '@/utils/stores/schoolStore';
import { useLanguage } from '@/contexts/LanguageContext';
import SkeletonLoader from '@/components/SkeletonLoader';

const { width } = Dimensions.get("window");

interface Student {
  id: number;
  name: string;
  absences: number;
  isPresent?: boolean | null;
}

interface ClassInfo {
  id: number;
  name: string;
}

interface AttendanceData {
  subject: string;
  periods: number;
}

export default function ClassAttendanceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const { activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    subject: '',
    periods: 1
  });
  const [attendanceStarted, setAttendanceStarted] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState<number | null>(null);

  const classId = params.class_id as string;
  const schoolId = activeSchool?.id?.toString() || '';

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getCurrentTerm = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 7 && month <= 12) return 1;
    if (month >= 1 && month <= 3) return 2;
    return 3;
  };

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      
      const studentsResponse = await fetch(`${Config.apiBaseUrl}/class-students?class_id=${classId}`);
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      const today = new Date().toISOString().split('T')[0];
      const term = getCurrentTerm();
      const attendanceResponse = await fetch(
        `${Config.apiBaseUrl}/attendances?school_id=${schoolId}&class_id=${classId}&date=${today}&term=${term}`
      );
      const attendanceData = await attendanceResponse.json();

      const studentsWithAttendance = studentsData.students.map((student: any) => {
        const attendance = attendanceData.success 
          ? attendanceData.data.find((a: any) => a.student_id === student.id)
          : null;
        
        return {
          ...student,
          absences: attendance?.hours || 0,
          isPresent: attendance ? attendance.is_present : null
        };
      });

      setClassInfo(studentsData.class);
      setStudents(studentsWithAttendance);
      setError(null);
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
    fetchClassStudents();
  };

  useEffect(() => {
    if (classId) {
      fetchClassStudents();
    }
  }, [classId]);

  const handleAttendanceSubmit = () => {
    if (!attendanceData.subject.trim()) {
      showAlert(
        language === 'fr' ? "Erreur" : "Error", 
        language === 'fr' ? "Veuillez entrer le nom de la matière" : "Please enter a subject name"
      );
      return;
    }

    if (attendanceData.periods !== 1 && attendanceData.periods !== 2) {
      showAlert(
        language === 'fr' ? "Erreur" : "Error",
        language === 'fr' ? "Les périodes doivent être 1 ou 2 heures" : "Periods must be either 1 or 2 hours"
      );
      return;
    }

    setAttendanceStarted(true);
    setShowAttendanceModal(false);
  };

  const markStudentAttendance = async (student: Student, isPresent: boolean) => {
    setSavingAttendance(student.id);
    try {
      const term = getCurrentTerm();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${Config.apiBaseUrl}/attendances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          student_id: student.id,
          class_id: classId,
          term: term,
          date: today,
          subject: attendanceData.subject,
          hours: isPresent ? 0 : attendanceData.periods,
          is_present: isPresent
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedStudents = students.map((s) =>
          s.id === student.id
            ? { 
                ...s, 
                absences: isPresent ? s.absences : s.absences + attendanceData.periods,
                isPresent: isPresent
              }
            : s
        );
        setStudents(updatedStudents);
      } else {
        throw new Error(data.message || 'Failed to update');
      }
    } catch (err) {
      showAlert(
        language === 'fr' ? "Erreur" : "Error",
        err instanceof Error ? err.message : 'Failed to update attendance'
      );
    } finally {
      setSavingAttendance(null);
    }
  };

  const StudentCard = ({ item }: { item: Student }) => {
    const isMarked = item.isPresent !== null;
    const isLoading = savingAttendance === item.id;
    
    return (
      <View style={[styles.studentCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
        <LinearGradient
          colors={[withOpacity('#6366F1', 0.2), withOpacity('#6366F1', 0.05)]}
          style={styles.avatarContainer}
        >
          <Feather name="user" size={22} color="#6366F1" />
        </LinearGradient>
        
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.absenceText, { color: colors.textSecondary }]}>
            {item.absences} {language === 'fr' ? 'heures absentes' : 'hours absent'}
          </Text>
        </View>
        
        {attendanceStarted && (
          <View style={styles.attendanceButtons}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : isMarked ? (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: withOpacity(item.isPresent ? '#10B981' : '#EF4444', 0.15) }
              ]}>
                <Feather 
                  name={item.isPresent ? 'check' : 'x'} 
                  size={16} 
                  color={item.isPresent ? '#10B981' : '#EF4444'} 
                />
                <Text style={{ 
                  color: item.isPresent ? '#10B981' : '#EF4444',
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4
                }}>
                  {item.isPresent 
                    ? (language === 'fr' ? 'Présent' : 'Present')
                    : (language === 'fr' ? 'Absent' : 'Absent')
                  }
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.attendanceBtn, styles.presentBtn]}
                  onPress={() => markStudentAttendance(item, true)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attendanceBtn, styles.absentBtn]}
                  onPress={() => markStudentAttendance(item, false)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    const markedCount = students.filter(s => s.isPresent !== null).length;
    const presentCount = students.filter(s => s.isPresent === true).length;
    
    return (
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'fr' ? 'Présences' : 'Attendance'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {classInfo?.name || ''}
          {attendanceStarted && ` • ${markedCount}/${students.length} ${language === 'fr' ? 'marqués' : 'marked'}`}
        </Text>
        
        {!attendanceStarted && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAttendanceModal(true)}
          >
            <Feather name="play" size={18} color="white" />
            <Text style={styles.startButtonText}>
              {language === 'fr' ? 'Commencer les présences' : 'Start Attendance'}
            </Text>
          </TouchableOpacity>
        )}
        
        {attendanceStarted && (
          <View style={[styles.summaryCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>{presentCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Présents' : 'Present'}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{markedCount - presentCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Absents' : 'Absent'}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{students.length - markedCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Restants' : 'Remaining'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20 }}>
          <View style={styles.listContent}>
            <SkeletonLoader type="header" />
            <SkeletonLoader type="list" count={8} height={85} />
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
              onPress={fetchClassStudents}
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
        data={students}
        renderItem={({ item }) => <StudentCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingTop: 16, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Aucun élève' : 'No students'}
            </Text>
          </View>
        }
      />

      {/* Start Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={[styles.modalContent, { backgroundColor: withOpacity(colors.card, 0.95) }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: withOpacity('#10B981', 0.15) }]}>
              <Feather name="clipboard" size={28} color="#10B981" />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Commencer les présences' : 'Start Attendance'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Matière' : 'Subject'}
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: withOpacity(colors.background, 0.5),
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder={language === 'fr' ? 'Ex: Mathématiques' : 'Ex: Mathematics'}
                placeholderTextColor={colors.textSecondary}
                value={attendanceData.subject}
                onChangeText={(text) => setAttendanceData(prev => ({ ...prev, subject: text }))}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Périodes (heures)' : 'Periods (hours)'}
              </Text>
              <View style={styles.periodsButtons}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    { backgroundColor: attendanceData.periods === 1 ? colors.primary : withOpacity(colors.text, 0.1) }
                  ]}
                  onPress={() => setAttendanceData(prev => ({ ...prev, periods: 1 }))}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: attendanceData.periods === 1 ? 'white' : colors.text }
                  ]}>
                    1 {language === 'fr' ? 'heure' : 'hour'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    { backgroundColor: attendanceData.periods === 2 ? colors.primary : withOpacity(colors.text, 0.1) }
                  ]}
                  onPress={() => setAttendanceData(prev => ({ ...prev, periods: 2 }))}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: attendanceData.periods === 2 ? 'white' : colors.text }
                  ]}>
                    2 {language === 'fr' ? 'heures' : 'hours'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: withOpacity(colors.text, 0.1) }]}
                onPress={() => setShowAttendanceModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAttendanceSubmit}
              >
                <Text style={styles.saveButtonText}>
                  {language === 'fr' ? 'Commencer' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  absenceText: {
    fontSize: 13,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  attendanceBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presentBtn: {
    backgroundColor: '#10B981',
  },
  absentBtn: {
    backgroundColor: '#EF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
    maxWidth: 360,
    padding: 28,
    borderRadius: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  periodsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
