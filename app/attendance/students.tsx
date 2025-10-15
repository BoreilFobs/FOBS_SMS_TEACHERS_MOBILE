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
  Alert,
  Platform,
  useColorScheme,
  Animated,
  Easing,
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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Student>);

const shimmerColors = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'];
const withOpacity = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ClassAttendanceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
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

  const classId = params.class_id as string;
  const schoolId = params.school_id as string;
  
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
      
      // Fetch students
      const studentsResponse = await fetch(
        `${Config.apiBaseUrl}/class-students?class_id=${classId}`
      );
      const studentsData = await studentsResponse.json();
      
      if (!studentsData.success) {
        throw new Error(studentsData.message || 'Failed to fetch students');
      }

      // Fetch attendance for today
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
      
      const response = await fetch(`${Config.apiBaseUrl}/attendances`, {
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
        <BlurView
          intensity={Platform.OS === 'ios' ? 12 : 100}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
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
            <Text style={[styles.absenceText, { color: colors.textSecondary }]}>
              {item.absences} hours absent
            </Text>
          </View>
          
          {attendanceStarted && (
            <View style={styles.attendanceButtons}>
              <Pressable
                style={[
                  styles.presentButton,
                  item.isPresent === true && styles.presentButtonActive,
                  item.isPresent !== null && { opacity: item.isPresent === true ? 1 : 0.5 }
                ]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => item.isPresent === null && markStudentAttendance(item, true)}
                disabled={item.isPresent !== null}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              
              <Pressable
                style={[
                  styles.absentButton,
                  item.isPresent === false && styles.absentButtonActive,
                  item.isPresent !== null && { opacity: item.isPresent === false ? 1 : 0.5 }
                ]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => item.isPresent === null && markStudentAttendance(item, false)}
                disabled={item.isPresent !== null}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          )}
        </BlurView>
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
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
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
            <View style={[styles.skeletonText, styles.skeletonAbsence, { backgroundColor: withOpacity(colors.text, 0.08) }]} />
          </View>
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
        <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={[styles.title, { color: colors.text }]}>Loading...</Text>
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
        <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.errorContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 10}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
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
              onPress={fetchClassStudents}
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
      <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      
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
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {classInfo?.name || 'Class Attendance'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Term {getCurrentTerm()} • {students.length} students
            </Text>
          </View>
          <Pressable
            style={[styles.downloadButton, { backgroundColor: withOpacity(colors.primary, 0.15) }]}
            onPress={() => {
              // TODO: Implement download functionality
              showAlert("Download", "Class list download feature coming soon!");
            }}
          >
            <Feather name="download" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {!attendanceStarted && (
        <Pressable
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAttendanceModal(true)}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="check-circle" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.startButtonText}>Start Attendance</Text>
        </Pressable>
      )}

      {attendanceStarted && (
        <BlurView
          intensity={Platform.OS === 'ios' ? 12 : 6}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.attendanceHeader,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(colors.card, 0.6) 
                : withOpacity(colors.card, 0.85),
            },
          ]}
        >
          <Feather name="book-open" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.attendanceSubject, { color: colors.text }]}>
            {attendanceData.subject} • {attendanceData.periods} hour{attendanceData.periods > 1 ? 's' : ''}
          </Text>
        </BlurView>
      )}

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
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
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
              Students will appear here once added to the class
            </Text>
          </BlurView>
        }
      />

      {/* Attendance Setup Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 30}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => setShowAttendanceModal(false)}
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
                    Setup Attendance
                  </Text>

                  <BlurView
                    intensity={Platform.OS === 'ios' ? 8 : 4}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: colors.border,
                        backgroundColor: colorScheme === 'dark'
                          ? withOpacity(colors.background, 0.5)
                          : withOpacity(colors.background, 0.7),
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Subject Name"
                      placeholderTextColor={colors.textSecondary}
                      value={attendanceData.subject}
                      onChangeText={(text) => setAttendanceData({...attendanceData, subject: text})}
                    />
                  </BlurView>

                  <View style={styles.periodsContainer}>
                    <Text style={[styles.periodsLabel, { color: colors.text }]}>
                      Number of Periods:
                    </Text>
                    <View style={styles.periodsButtons}>
                      <Pressable
                        style={[
                          styles.periodButton,
                          { borderColor: colors.border },
                          attendanceData.periods === 1 && { 
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        ]}
                        onPress={() => setAttendanceData({...attendanceData, periods: 1})}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: colors.text },
                          attendanceData.periods === 1 && { color: 'white' }
                        ]}>
                          1 hour
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.periodButton,
                          { borderColor: colors.border },
                          attendanceData.periods === 2 && { 
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        ]}
                        onPress={() => setAttendanceData({...attendanceData, periods: 2})}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: colors.text },
                          attendanceData.periods === 2 && { color: 'white' }
                        ]}>
                          2 hours
                        </Text>
                      </Pressable>
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
                      <Text style={[styles.buttonText, { color: 'white' }]}>Start</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '500',
  },
  downloadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  startButton: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  attendanceSubject: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
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
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  absenceText: {
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '500',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  presentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  presentButtonActive: {
    backgroundColor: '#10B981',
  },
  absentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  absentButtonActive: {
    backgroundColor: '#EF4444',
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
    marginBottom: 8,
  },
  skeletonName: {
    width: '70%',
    height: 16,
  },
  skeletonAbsence: {
    width: '50%',
    height: 13,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 32,
    gap: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    height: 64,
    padding: 20,
    fontSize: 18,
    fontWeight: '500',
  },
  periodsContainer: {
    gap: 16,
  },
  periodsLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  periodsButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  periodButtonText: {
    fontWeight: '600',
    fontSize: 17,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 17,
  },
});