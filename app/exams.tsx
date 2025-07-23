import React, { useEffect, useState } from "react";
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
  RefreshControl
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const subjectId = params.subject_id as string;
  const schoolId = params.school_id as string;
  const router = useRouter();
  const [sequences, setSequences] = useState<ExamSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<ExamSequence | null>(null);

  const fetchSequences = async () => {
    try {
      setLoading(true);      
      if (!schoolId) {
        throw new Error('No school selected');
      }

      const response = await fetch(
        `${API_URL}/exam-sequences?school_id=${schoolId}`
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

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
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
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchSequences}
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
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Exam Sequences
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {sequences.length} sequences • Tap to manage
        </Text>
      </View>

      <FlatList
        data={sequences}
        keyExtractor={(item) => `${item.name}-${item.term}-${item.academic_year}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.sequenceCard, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setSelectedSequence(item)}
          >
            <LinearGradient
              colors={['#6366F130', '#6366F110']}
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
              <TouchableOpacity 
                onPress={() => handlePublishToggle(item)}
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: item.is_published ? '#10B98120' : '#EF444420',
                    borderColor: item.is_published ? '#10B981' : '#EF4444'
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
              </TouchableOpacity>
              
              <View style={[
                styles.markEntryBadge,
                { 
                  backgroundColor: item.mark_entry_allowed ? '#10B98120' : '#EF444420',
                }
              ]}>
                <Feather 
                  name={item.mark_entry_allowed ? 'unlock' : 'lock'} 
                  size={14} 
                  color={item.mark_entry_allowed ? '#10B981' : '#EF4444'} 
                />
                <Text style={{ 
                  color: item.mark_entry_allowed ? '#10B981' : '#EF4444',
                  marginLeft: 4,
                  fontSize: 12
                }}>
                  {item.mark_entry_allowed ? 'Open' : 'Closed'}
                </Text>
              </View>
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
            <Feather name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exam sequences found
            </Text>
          </View>
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
          intensity={30}
          tint={colorScheme}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
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
                                    router.push(`/students?sequence_id=${selectedSequence.id}&school_id=${schoolId}&class_id=${params.class_id}&subject_id=${subjectId}`)
                                }}
                                >
                                <Text style={[styles.buttonText, { color: colors.text, backgroundColor: colors.textSecondary, padding: 12, borderRadius: 8 }]}>
                                    fill marks
                                </Text>
                                </Pressable>
                            </View>
                        ) : (
                            ""
                        )}
                        
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
  sequenceCard: {
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
  sequenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sequenceMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  sequenceDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  markEntryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    gap: 16,
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