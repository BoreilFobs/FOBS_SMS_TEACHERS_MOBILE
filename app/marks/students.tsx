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
  KeyboardAvoidingView,
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
  currentMark?: number | null;
  markId?: number | null;
}

interface ClassInfo {
  id: number;
  name: string;
}

export default function StudentMarksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const { activeSchool } = useSchoolStore();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMark, setLoadingMark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [markInput, setMarkInput] = useState("");
  const [deletingMarkId, setDeletingMarkId] = useState<number | null>(null);

  const classId = params.class_id as string;
  const schoolId = activeSchool?.id?.toString() || '';
  const sequenceId = params.sequence_id as string;
  const subjectId = params.subject_id as string;

  const withOpacity = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const fetchStudentsWithMarks = async () => {
    try {
      setLoading(true);
      
      const studentsResponse = await fetch(`${Config.apiBaseUrl}/class-students?class_id=${classId}`);
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      const marksResponse = await fetch(
        `${Config.apiBaseUrl}/marks?school_id=${schoolId}&exam_id=${sequenceId}&subject_id=${subjectId}&class_id=${classId}`
      );
      const marksData = await marksResponse.json();

      const studentsWithMarks = studentsData.students.map((student: any) => {
        const existingMark = marksData.success 
          ? marksData.data.find((mark: any) => mark.student_id === student.id)
          : null;
        
        return {
          ...student,
          currentMark: existingMark ? existingMark.mark : null,
          markId: existingMark ? existingMark.id : null
        };
      });

      setClassInfo(studentsData.class);
      setStudents(studentsWithMarks);
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
    fetchStudentsWithMarks();
  };

  useEffect(() => {
    if (classId) {
      fetchStudentsWithMarks();
    }
  }, [classId]);

  const handleMarkSubmit = async () => {
    if (!selectedStudent || !markInput) return;
    
    const mark = parseFloat(markInput);
    if (isNaN(mark) || mark < 0 || mark > 20) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'La note doit être entre 0 et 20' : 'Mark must be between 0 and 20'
      );
      return;
    }

    setLoadingMark(true);
    try {
      const response = await fetch(`${Config.apiBaseUrl}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          student_id: selectedStudent.id,
          subject_id: subjectId,
          class_id: classId,
          exam_id: sequenceId,
          mark: mark
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedStudents = students.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, currentMark: mark, markId: data.data.id }
            : student
        );
        setStudents(updatedStudents);
        setSelectedStudent(null);
        setMarkInput("");
      } else {
        throw new Error(data.message || 'Failed to save mark');
      }
    } catch (err) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        err instanceof Error ? err.message : 'Failed to save mark'
      );
    } finally {
      setLoadingMark(false);
    }
  };

  const handleDeleteMark = async (student: Student) => {
    if (!student.markId) return;

    Alert.alert(
      language === 'fr' ? 'Supprimer la note' : 'Delete Mark',
      language === 'fr' 
        ? `Êtes-vous sûr de vouloir supprimer la note de ${student.name}?`
        : `Are you sure you want to delete the mark for ${student.name}?`,
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingMarkId(student.markId!);
            try {
              const response = await fetch(`${Config.apiBaseUrl}/marks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  school_id: schoolId,
                  student_id: student.id,
                  subject_id: subjectId,
                  class_id: classId,
                  exam_id: sequenceId,
                })
              });

              const data = await response.json();

              if (data.success) {
                const updatedStudents = students.map((s) =>
                  s.id === student.id ? { ...s, currentMark: null, markId: null } : s
                );
                setStudents(updatedStudents);
              } else {
                throw new Error(data.message || 'Failed to delete');
              }
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            } finally {
              setDeletingMarkId(null);
            }
          }
        }
      ]
    );
  };

  const getMarkColor = (mark: number | null | undefined) => {
    if (mark === null || mark === undefined) return colors.textSecondary;
    if (mark >= 16) return '#10B981';
    if (mark >= 10) return '#F59E0B';
    return '#EF4444';
  };

  const StudentCard = ({ item }: { item: Student }) => {
    const hasMark = item.currentMark !== null && item.currentMark !== undefined;
    const markColor = getMarkColor(item.currentMark);
    
    return (
      <TouchableOpacity
        style={[styles.studentCard, { backgroundColor: withOpacity(colors.card, 0.9) }]}
        onPress={() => {
          setSelectedStudent(item);
          setMarkInput(item.currentMark?.toString() || "");
        }}
        activeOpacity={0.7}
      >
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
        </View>
        
        <View style={styles.markSection}>
          {hasMark ? (
            <View style={styles.markDisplay}>
              <View style={[styles.markBadge, { backgroundColor: withOpacity(markColor, 0.15) }]}>
                <Text style={[styles.markText, { color: markColor }]}>
                  {item.currentMark}/20
                </Text>
              </View>
              {item.markId && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: withOpacity('#EF4444', 0.15) }]}
                  onPress={() => handleDeleteMark(item)}
                  disabled={deletingMarkId === item.markId}
                >
                  {deletingMarkId === item.markId ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Feather name="trash-2" size={14} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.addMarkButton, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
              <Feather name="edit-2" size={16} color={colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: colors.text }]}>
        {language === 'fr' ? 'Saisir les notes' : 'Enter Marks'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {classInfo?.name || ''} • {students.filter(s => s.currentMark !== null).length}/{students.length} {language === 'fr' ? 'notes saisies' : 'marks entered'}
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
              onPress={fetchStudentsWithMarks}
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
              {language === 'fr' ? 'Aucun élève dans cette classe' : 'No students in this class'}
            </Text>
          </View>
        }
      />

      {/* Mark Entry Modal */}
      <Modal
        visible={selectedStudent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={[styles.modalContent, { backgroundColor: withOpacity(colors.card, 0.95) }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: withOpacity('#6366F1', 0.15) }]}>
              <Feather name="edit-3" size={28} color="#6366F1" />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedStudent?.name}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Entrez la note (0-20)' : 'Enter mark (0-20)'}
            </Text>
            
            <TextInput
              style={[styles.markInput, { 
                backgroundColor: withOpacity(colors.background, 0.5),
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={markInput}
              onChangeText={setMarkInput}
              maxLength={5}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: withOpacity(colors.text, 0.1) }]}
                onPress={() => {
                  setSelectedStudent(null);
                  setMarkInput("");
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleMarkSubmit}
                disabled={loadingMark || !markInput}
              >
                {loadingMark ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {language === 'fr' ? 'Enregistrer' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  },
  markSection: {
    alignItems: 'flex-end',
  },
  markDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMarkButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  markInput: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
