import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
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
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from '@/constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ExamSequence>);

const shimmerColors = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'];
const withOpacity = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ExamSequencesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const subjectId = params.subject_id as string;
  const schoolId = params.school_id as string;
  const router = useRouter();
  const [sequences, setSequences] = useState<ExamSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<ExamSequence | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const fetchSequences = async () => {
    try {
      setLoading(true);      
      if (!schoolId) {
        throw new Error('No school selected');
      }

      const response = await fetch(
        `${Config.apiBaseUrl}/exam-sequences?school_id=${schoolId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSequences(data.data);
      } else {
        setError(data.message || 'Failed to fetch exam sequences');
      }
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
    fetchSequences();
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handlePublishToggle = async (sequence: ExamSequence) => {
    try {
      // Here you would call your API to toggle publish status
      // This is just UI update for the example
      const updatedSequences = sequences.map(s => 
        s.name === sequence.name ? { ...s, is_published: !s.is_published } : s
      );
      setSequences(updatedSequences);
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  // Exam card component with animations
  const ExamCard = ({ item, index }: { item: ExamSequence; index: number }) => {
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
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => setSelectedSequence(item)}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 12 : 100}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.sequenceCard,
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
              style={styles.sequenceIcon}
            >
              <Feather name="calendar" size={20} color="#6366F1" />
            </LinearGradient>
            
            <View style={styles.sequenceInfo}>
              <Text style={[styles.sequenceName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.sequenceMeta, { color: colors.textSecondary }]}>
                Term {item.term} • {item.academic_year}
              </Text>
              <Text style={[styles.sequenceDate, { color: colors.textSecondary }]}>
                Starts: {new Date(item.start_date).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 8 : 4}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: item.is_published 
                      ? withOpacity('#10B981', 0.2) 
                      : withOpacity('#EF4444', 0.2),
                  }
                ]}
              >
                <Text style={{ 
                  color: item.is_published ? '#10B981' : '#EF4444',
                  fontWeight: '600',
                  fontSize: 12
                }}>
                  {item.is_published ? 'Published' : 'Draft'}
                </Text>
              </BlurView>
              
              <BlurView
                intensity={Platform.OS === 'ios' ? 8 : 4}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[
                  styles.markEntryBadge,
                  { 
                    backgroundColor: item.mark_entry_allowed 
                      ? withOpacity('#10B981', 0.2) 
                      : withOpacity('#EF4444', 0.2),
                  }
                ]}
              >
                <Feather 
                  name={item.mark_entry_allowed ? 'unlock' : 'lock'} 
                  size={14} 
                  color={item.mark_entry_allowed ? '#10B981' : '#EF4444'} 
                />
                <Text style={{ 
                  color: item.mark_entry_allowed ? '#10B981' : '#EF4444',
                  marginLeft: 4,
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {item.mark_entry_allowed ? 'Open' : 'Closed'}
                </Text>
              </BlurView>
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
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.sequenceCard,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(colors.card, 0.4) 
                : withOpacity(colors.card, 0.6),
            },
          ]}
        >
          <View style={[styles.sequenceIcon, { backgroundColor: withOpacity(colors.text, 0.1) }]} />
          <View style={styles.sequenceInfo}>
            <View style={[styles.skeletonText, styles.skeletonTitle, { backgroundColor: withOpacity(colors.text, 0.1) }]} />
            <View style={[styles.skeletonText, styles.skeletonSubtitle, { backgroundColor: withOpacity(colors.text, 0.08) }]} />
            <View style={[styles.skeletonText, styles.skeletonDate, { backgroundColor: withOpacity(colors.text, 0.08) }]} />
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderExamCard = ({ item, index }: { item: ExamSequence; index: number }) => (
    <ExamCard item={item} index={index} />
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
        <View style={[styles.header, { paddingTop: 0 }]}>
          {/* <Text style={[styles.title, { color: colors.text }]}>Exam Sequences</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Loading sequences...</Text> */}
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
              onPress={fetchSequences}
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
      />

      <View style={[styles.header, { paddingTop: 10 }]}>
        {/* <Text style={[styles.title, { color: colors.text }]}>
          Exam Sequences
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        </Text> */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{sequences.length} {sequences.length === 1 ? 'sequence' : 'sequences'} • Tap to manage</Text>
      </View>

      <AnimatedFlatList
        data={sequences}
        keyExtractor={(item) => `${item.name}-${item.term}-${item.academic_year}`}
        contentContainerStyle={styles.listContent}
        renderItem={renderExamCard}
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
            <Feather name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No exam sequences found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Sequences will appear here once created
            </Text>
          </BlurView>
        }
      />

      {/* Sequence Detail Modal */}
      <Modal
        visible={!!selectedSequence}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSequence(null)}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 30}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => setSelectedSequence(null)}
          >
            <View style={styles.modalOverlay}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 20 : 100}
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
                  {selectedSequence && (
                    <>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {selectedSequence.name}
                      </Text>
                      
                      <View style={styles.modalRow}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Term:</Text>
                        <Text style={[styles.modalValue, { color: colors.text }]}>
                          {selectedSequence.term}
                        </Text>
                      </View>
                      
                      <View style={styles.modalRow}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Academic Year:</Text>
                        <Text style={[styles.modalValue, { color: colors.text }]}>
                          {selectedSequence.academic_year}
                        </Text>
                      </View>
                      
                      <View style={styles.modalRow}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Start Date:</Text>
                        <Text style={[styles.modalValue, { color: colors.text }]}>
                          {new Date(selectedSequence.start_date).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={styles.modalRow}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Status:</Text>
                        <Text style={[styles.modalValue, { 
                          color: selectedSequence.is_published ? '#10B981' : '#EF4444'
                        }]}>
                          {selectedSequence.is_published ? 'Published' : 'Draft'}
                        </Text>
                      </View>
                      
                      <View style={styles.modalRow}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Mark Entry:</Text>
                        <Text style={[styles.modalValue, { 
                          color: selectedSequence.mark_entry_allowed ? '#10B981' : '#EF4444'
                        }]}>
                          {selectedSequence.mark_entry_allowed ? 'Open' : 'Closed'}
                        </Text>
                      </View>

                      <View style={styles.modalButtons}>  
                        {selectedSequence.mark_entry_allowed ? (
                          <View style={styles.modalButtons}>
                            <Pressable
                              style={[styles.cancelButton, { borderColor: colors.border }]}
                              onPress={() => {
                                setSelectedSequence(null);
                                router.push(`/marks/students?sequence_id=${selectedSequence.id}&school_id=${schoolId}&class_id=${params.class_id}&subject_id=${subjectId}`)
                              }}
                            >
                              <Text style={[styles.buttonText, { color: colors.text, backgroundColor: colors.textSecondary, padding: 12, borderRadius: 8 }]}>
                                fill marks
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                        
                        <View style={styles.modalButtons}>
                          <Pressable
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={() => setSelectedSequence(null)}
                          >
                            <Text style={[styles.buttonText, { color: colors.text, backgroundColor: "red", padding: 12, borderRadius: 8}]}>
                              Close
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </>
                  )}
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sequenceCard: {
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
  sequenceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  sequenceMeta: {
    fontSize: 13,
    marginBottom: 3,
    fontWeight: '500',
    opacity: 0.8,
  },
  sequenceDate: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  markEntryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chevronPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  skeletonTitle: {
    width: '70%',
    height: 16,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 13,
  },
  skeletonDate: {
    width: '40%',
    height: 12,
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
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonText: {
    fontWeight: '600',
  },
});