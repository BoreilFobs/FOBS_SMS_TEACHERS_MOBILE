import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useColorScheme
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface Student {
  id: number;
  name: string;
  absences: number;
  isPresent?: boolean | null; // null = not marked yet
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
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  
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

  const classId = params.class_id as string;
  const schoolId = params.school_id as string;
  const showAlert = (title, message) => {
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
      
      // Fetch students
      const studentsResponse = await fetch(
        `${API_URL}/class-students?class_id=${classId}`
      );
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      // Fetch attendance for today
      const today = new Date().toISOString().split('T')[0];
      const term = getCurrentTerm();
      const attendanceResponse = await fetch(
        `${API_URL}/attendances?school_id=${schoolId}&class_id=${classId}&date=${today}&term=${term}`
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
      setError(err instanceof Error ? err.message : 'Network error occurred');
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
      showAlert("Error", "Please enter a subject name");
      return;
    }

    if (attendanceData.periods !== 1 && attendanceData.periods !== 2) {
      showAlert("Error", "Periods must be either 1 or 2 hours");
      return;
    }

    setAttendanceStarted(true);
    setShowAttendanceModal(false);
  };

  const markStudentAttendance = async (student: Student, isPresent: boolean) => {
    try {
      const term = getCurrentTerm();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/attendances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // Update local state
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
        throw new Error(data.message || 'Failed to update attendance');
      }
    } catch (err) {
      showAlert(
        "Error",
        err instanceof Error ? err.message : 'Failed to update attendance'
      );
      console.error(err);
    }
  };

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchClassStudents}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={Platform.OS == 'ios' ? 330 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {classInfo?.name || 'Class Attendance'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Term {getCurrentTerm()} • {students.length} students
        </Text>
      </View>

      {!attendanceStarted && (
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAttendanceModal(true)}
        >
          <Text style={styles.startButtonText}>Start Attendance</Text>
        </TouchableOpacity>
      )}

      {attendanceStarted && (
        <View style={[styles.attendanceHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.attendanceSubject, { color: colors.text }]}>
            {attendanceData.subject} • {attendanceData.periods} hour{attendanceData.periods > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[
            styles.studentCard, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }
          ]}>
            <LinearGradient
              colors={['#6366F130', '#6366F110']}
              style={styles.studentAvatar}
            >
              <Feather name="user" size={20} color="#6366F1" />
            </LinearGradient>
            
            <View style={styles.studentInfo}>
              <Text style={[styles.studentName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.absenceText, { color: colors.textSecondary }]}>
                {item.absences} hours absent
              </Text>
            </View>
            
            {attendanceStarted && (
              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[
                    styles.presentButton,
                    item.isPresent === true && { backgroundColor: '#4CAF50' },
                    item.isPresent !== null && { opacity: item.isPresent === true ? 1 : 0.5 }
                  ]}
                  onPress={() => item.isPresent === null && markStudentAttendance(item, true)}
                  disabled={item.isPresent !== null}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.absentButton,
                    item.isPresent === false && { backgroundColor: '#F44336' },
                    item.isPresent !== null && { opacity: item.isPresent === false ? 1 : 0.5 }
                  ]}
                  onPress={() => item.isPresent === null && markStudentAttendance(item, false)}
                  disabled={item.isPresent !== null}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No students found
            </Text>
          </View>
        }
      />

      {/* Attendance Setup Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <BlurView
          intensity={30}
          tint={colorScheme}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Setup Attendance
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Subject Name"
                placeholderTextColor={colors.textSecondary}
                value={attendanceData.subject}
                onChangeText={(text) => setAttendanceData({...attendanceData, subject: text})}
              />

              <View style={styles.periodsContainer}>
                <Text style={[styles.periodsLabel, { color: colors.text }]}>
                  Number of Periods:
                </Text>
                <View style={styles.periodsButtons}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      attendanceData.periods === 1 && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setAttendanceData({...attendanceData, periods: 1})}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      attendanceData.periods === 1 && { color: 'white' }
                    ]}>
                      1 hour
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      attendanceData.periods === 2 && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setAttendanceData({...attendanceData, periods: 2})}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      attendanceData.periods === 2 && { color: 'white' }
                    ]}>
                      2 hours
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowAttendanceModal(false)}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleAttendanceSubmit}
                  disabled={!attendanceData.subject.trim()}
                >
                  <Text style={styles.buttonText}>Start</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  startButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  attendanceSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  absenceText: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  periodsContainer: {
    gap: 8,
  },
  periodsLabel: {
    fontSize: 16,
  },
  periodsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  periodButtonText: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});