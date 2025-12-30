import React, { useEffect, useState, useRef } from "react";
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
  useColorScheme,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Student>);

const shimmerColors = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'];
const withOpacity = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function StudentMarksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMark, setLoadingMark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [markInput, setMarkInput] = useState("");
  const [deletingMarkId, setDeletingMarkId] = useState<number | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

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
        `${Config.apiBaseUrl}/class-students?class_id=${classId}`
      );
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      // Then fetch existing marks for this exam/subject/class
      const marksResponse = await fetch(
        `${Config.apiBaseUrl}/marks?school_id=${schoolId}&exam_id=${sequenceId}&subject_id=${subjectId}&class_id=${classId}`
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
      const response = await fetch(`${Config.apiBaseUrl}/marks`, {
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
        throw new Error(`${data.message} Check Network` || 'Failed to save mark');
      }
    } catch (err) {
      alert(err instanceof Error ? `${err.message} Check Network` : 'Failed to save mark');
      console.error(err);
    }
  };

  const handleDeleteMark = async (student: Student) => {
    if (!student.markId) return;

    Alert.alert(
      "Delete Mark",
      `Are you sure you want to delete the mark for ${student.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingMarkId(student.markId!);
            try {
              const response = await fetch(`${Config.apiBaseUrl}/marks`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
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
                // Update local state - remove the mark
                const updatedStudents = students.map((s) =>
                  s.id === student.id
                    ? { ...s, currentMark: null, markId: null }
                    : s
                );
                setStudents(updatedStudents);
              } else {
                throw new Error(data.message || 'Failed to delete mark');
              }
            } catch (err) {
              alert(err instanceof Error ? `${err.message} Check Network` : 'Failed to delete mark');
              console.error(err);
            } finally {
              setDeletingMarkId(null);
            }
          }
        }
      ]
    );
  };

  // Student card component with animations
  const StudentCard = ({ item, index }: { item: Student; index: number }) => {
    const mountAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.spring(mountAnim, {
        toValue: 1,
        friction: 9,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, [mountAnim, index]);

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.96,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const translateY = mountAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    const opacity = mountAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity,
            transform: [{ translateY }, { scale: pressAnim }],
          },
        ]}
      >
        <Pressable 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut} 
          onPress={() => {
            setSelectedStudent(item);
            setMarkInput(item.currentMark?.toString() || "");
          }}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 12 : 100}
            tint={colorScheme ?? 'light'}
            style={[
              styles.studentCard,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity(colors.card, 0.6) 
                  : withOpacity(colors.card, 0.85),
              },
            ]}
          >
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.05)']
                  : ['rgba(99, 102, 241, 0.12)', 'rgba(99, 102, 241, 0.08)']
              }
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
              {item.currentMark !== null && item.currentMark !== undefined ? (
                <View style={styles.markWithDelete}>
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 8 : 4}
                    tint={colorScheme ?? 'light'}
                    style={[
                      styles.markBadge,
                      {
                        backgroundColor: item.currentMark >= 10 
                          ? withOpacity('#10B981', 0.2) 
                          : withOpacity('#EF4444', 0.2),
                      },
                    ]}
                  >
                    <Text style={[
                      styles.markText, 
                      { color: item.currentMark >= 10 ? '#10B981' : '#EF4444' }
                    ]}>
                      {item.currentMark}/20
                    </Text>
                  </BlurView>
                  {item.markId && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteMark(item);
                      }}
                      style={[
                        styles.deleteButton,
                        { backgroundColor: withOpacity('#EF4444', 0.15) }
                      ]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {deletingMarkId === item.markId ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Feather name="x" size={14} color="#EF4444" />
                      )}
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={[styles.editIcon, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                  <Feather name="edit-2" size={16} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.chevronPill}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  };

  // Skeleton card component
  const SkeletonCard = ({ index }: { index: number }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1400,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View style={[styles.cardWrapper, { opacity }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 12 : 8}
          tint={colorScheme ?? 'light'}
          style={[
            styles.studentCard,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(colors.card, 0.4) 
                : withOpacity(colors.card, 0.6),
            },
          ]}
        >
          <View style={[styles.studentAvatar, { backgroundColor: withOpacity(colors.text, 0.1) }]} />
          <View style={styles.studentInfo}>
            <View style={[styles.skeletonText, styles.skeletonName, { backgroundColor: withOpacity(colors.text, 0.1) }]} />
          </View>
          <View style={[styles.skeletonMark, { backgroundColor: withOpacity(colors.text, 0.08) }]} />
        </BlurView>
      </Animated.View>
    );
  };

  const renderStudentCard = ({ item, index }: { item: Student; index: number }) => (
    <StudentCard item={item} index={index} />
  );

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme ?? 'light'} />
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <View style={[styles.header, { paddingTop: 0 }]}>
          {/* <Text style={[styles.title, { color: colors.text }]}>Student Marks</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Loading students...</Text> */}
        </View>
        <View style={styles.loadingGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </View>
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
        <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme ?? 'light'} />
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.errorContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 10}
            tint={colorScheme ?? 'light'}
            style={[
              styles.errorCard,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity(colors.card, 0.7) 
                  : withOpacity(colors.card, 0.9),
              },
            ]}
          >
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <Pressable 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchStudentsWithMarks}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </BlurView>
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
      <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme ?? 'light'} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(0,0,0,0.6)', 'transparent']
            : ['rgba(255,255,255,0.8)', 'transparent']
        }
        style={styles.headerGradient}
      />

      <View style={[styles.header, { paddingTop: 0 }]}>
        {/* <Text style={[styles.title, { color: colors.text }]}>
          {classInfo?.name || 'Class'}
        </Text> */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {students.length} {classInfo?.name || 'Class'} {students.length === 1 ? 'student' : 'students'} • Tap to enter marks on 20
        </Text>
      </View>

      <AnimatedFlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderStudentCard}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 10}
            tint={colorScheme ?? 'light'}
            style={[
              styles.emptyState,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? withOpacity(colors.card, 0.6) 
                  : withOpacity(colors.card, 0.85),
              },
            ]}
          >
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No students found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Students will appear here once enrolled
            </Text>
          </BlurView>
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
          intensity={Platform.OS === 'ios' ? 60 : 50}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => {setSelectedStudent(null);setLoadingMark(false);}}
          >
            <View style={styles.modalOverlay}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 20 : 10}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={[
                    styles.modalContent, 
                    { 
                      backgroundColor: colorScheme === 'dark' 
                        ? withOpacity(colors.card, 0.85) 
                        : withOpacity(colors.card, 0.9),
                    }
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Enter Mark for {selectedStudent?.name}
                  </Text>

                  <BlurView
                    intensity={Platform.OS === 'ios' ? 8 : 4}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={[
                      styles.markInputContainer,
                      {
                        borderColor: colors.border,
                        backgroundColor: colorScheme === 'dark' 
                          ? withOpacity(colors.background, 0.6) 
                          : withOpacity(colors.background, 0.8),
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.markInput,
                        {
                          color: colors.text,
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
                  </BlurView>

                  <View style={styles.modalButtons}>
                    <Pressable
                      style={[styles.cancelButton, { borderColor: colors.border }]}
                      onPress={() => {setSelectedStudent(null);setLoadingMark(false);}}
                    >
                      <Text style={[styles.buttonText, { color: colors.text }]}>
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.submitButton,
                        { 
                          backgroundColor: colors.primary,
                          opacity: !markInput || loadingMark ? 0.6 : 1,
                        },
                      ]}
                      onPress={handleMarkSubmit}
                      disabled={!markInput || loadingMark}
                    >
                      {loadingMark ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={[styles.buttonText, { color: 'white' }]}>Submit</Text>
                      )}
                    </Pressable>
                  </View>
                </BlurView>
              </Pressable>
            </View>
          </Pressable>
        </BlurView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 10,
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
    pointerEvents: 'none',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    paddingTop: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    paddingTop: 40,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  markContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  markBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  markText: {
    fontSize: 15,
    fontWeight: '700',
  },
  markWithDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    marginTop: 60,
    marginHorizontal: 24,
    padding: 48,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  skeletonText: {
    height: 14,
    borderRadius: 7,
  },
  skeletonName: {
    width: '60%',
    height: 16,
  },
  skeletonMark: {
    width: 50,
    height: 28,
    borderRadius: 10,
    marginRight: 8,
  },
  modalBackdrop: {
    flex: 1,
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
    gap: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  markInputContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  markInput: {
    height: 56,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 15,
  },
});