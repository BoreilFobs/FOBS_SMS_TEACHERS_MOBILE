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
  Dimensions,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useColorScheme
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface Student {
  id: number;
  name: string;
  currentMark?: number | null;
  markId?: number | null; // Add this to track mark ID if it exists
}

interface ClassInfo {
  id: number;
  name: string;
}

export default function StudentMarksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMark, setLoadingMark] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [markInput, setMarkInput] = useState("");

  const classId = params.class_id as string;
  const schoolId = params.school_id as string;
  const sequenceId = params.sequence_id as string;
  const subjectId = params.subject_id as string;
  console.log(`id : ${params.subject_id} classId: ${classId}, schoolId: ${schoolId}, sequenceId: ${sequenceId}, subjectId: ${subjectId}`);
  
 const fetchStudentsWithMarks = async () => {
    try {
      setLoading(true);
      
      // First fetch students in class
      const studentsResponse = await fetch(
        `${API_URL}/class-students?class_id=${classId}`
      );
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      // Then fetch existing marks for this exam/subject/class
      const marksResponse = await fetch(
        `${API_URL}/marks?school_id=${schoolId}&exam_id=${sequenceId}&subject_id=${subjectId}&class_id=${classId}`
      );
      const marksData = await marksResponse.json();

      // Combine the data
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
      setError(err instanceof Error ? err.message : 'Network error occurred');
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
    setLoadingMark(true);
    try {
      const response = await fetch(`${API_URL}/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_id: schoolId,
          student_id: selectedStudent.id,
          subject_id: subjectId,
          class_id: classId,
          exam_id: sequenceId,
          mark: parseFloat(markInput)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        const updatedStudents = students.map((student) =>
          student.id === selectedStudent.id
            ? { 
                ...student, 
                currentMark: parseFloat(markInput),
                markId: data.data.id
              }
            : student
        );
        setLoadingMark(false);

        setStudents(updatedStudents);

        setSelectedStudent(null);
        setMarkInput("");
      } else {
        throw new Error(data.message || 'Failed to save mark');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save mark');
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
            onPress={fetchStudentsWithMarks}
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
      <BlurView intensity={Platform.OS == "ios" ? 330 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {classInfo?.name || 'Class'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {students.length} students • Tap to enter marks on 20
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.studentCard, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
            onPress={() => {
              setSelectedStudent(item);
              setMarkInput(item.currentMark?.toString() || "");
            }}
          >
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
            </View>
            
            <View style={styles.markContainer}>
              {item.currentMark ? (
                <Text style={[styles.markText, { color: item.currentMark >= 10 ? colors.primary : "red" }]}>
                  {item.currentMark}
                </Text>
              ) : (
                <Feather name="edit" size={18} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
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

      {/* Mark Entry Modal */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <BlurView
          intensity={30}
          tint={colorScheme}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Enter Mark for {selectedStudent?.name}
              </Text>

              <TextInput
                style={[
                  styles.markInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Enter mark (0-20)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={markInput}
                onChangeText={(text) => {
                  // Validate input is between 0 and 20
                  const num = parseFloat(text);
                  if (text === '' || (!isNaN(num) && num >= 0 && num <= 20)) {
                    setMarkInput(text);
                  }
                }}
                maxLength={5} // Allow for decimals like 18.5
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setSelectedStudent(null)}
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
                  onPress={handleMarkSubmit}
                  disabled={!markInput || loadingMark}
                >
                  {loadingMark ? (
                    <ActivityIndicator color={colors.primary} style={styles.loader} />
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
                  )}
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  markContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  markText: {
    fontSize: 16,
    fontWeight: '700',
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
  markInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
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