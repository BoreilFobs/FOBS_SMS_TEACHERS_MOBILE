import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Platform,
  RefreshControl
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.4;

interface Subject {
  id: number;
  name: string;
  code: string;
}

export default function SubjectsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, teacher, loadUserData } = useUserStore();
  
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = params.schoolId as string;
  const teacherId = teacher?.id;
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      console.log(teacher);

  console.log("Fetching subjects for schoolId:", schoolId, "and teacherId:", teacherId);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_URL}/teacher-subjects?school_id=${schoolId}&teacher_id=${teacherId}`, // Replace with actual schoolId and teacherId
      );
      const data = await response.json();
      console.log('API Response:', data.success);
      
      
      if (data.success) {
        setSubjects(data.data);
      } else {
        setError(data.message || 'Failed to fetch subjects');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubjects();
  };

  useEffect(() => {
    if (schoolId && teacherId) {
      fetchSubjects();
    }
  }, [schoolId, teacherId]);

  const renderSubjectCard = ({ item }: { item: Subject }) => {
    // Get icon and color based on subject name or code
    const subjectConfig = getSubjectConfig(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.subjectCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.9}
        onPress={() => router.push(`/marks/classes?subjectId=${item.id}&schoolId=${schoolId}`)}
      >
        <LinearGradient
          colors={[subjectConfig.color + '30', subjectConfig.color + '10']}
          style={styles.iconContainer}
        >
          <Feather name={subjectConfig.icon} size={28} color={subjectConfig.color} />
        </LinearGradient>
        
        <View style={styles.textContainer}>
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>
            {item.code}
          </Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.textSecondary}
            style={{ opacity: 0.7 }}
          />
        </View>
      </TouchableOpacity>
    );
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
      
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingCard, { backgroundColor: colors.card + 'CC' }, {borderColor: colors.border}]} >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading your subjects...
          </Text>
        </View>
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
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, {borderColor: colors.border}, { backgroundColor: colors.card + 'CC' }]}>
            <MaterialIcons 
              name="error-outline" 
              size={48} 
              color={colors.error} 
              style={styles.errorIcon}
            />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Something went wrong
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchSubjects}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
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

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View>
          <Text style={styles.logo}>FobsSMS</Text><Text style={[styles.title, { color: colors.text }]}>Teacher Mark Filling</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select a subject to continue
          </Text>
        </View>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="book" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No subjects assigned
            </Text>
          </View>
        }
      />
    </ImageBackground>
  );
}

// Helper function to get icon and color based on subject
function getSubjectConfig(subjectName: string) {
  const lowerName = subjectName.toLowerCase();
  
  if (lowerName.includes('math')) {
    return { icon: 'hash', color: '#6366F1' };
  } else if (lowerName.includes('eng')) {
    return { icon: 'book-open', color: '#10B981' };
  } else if (lowerName.includes('phy')) {
    return { icon: 'aperture', color: '#EF4444' };
  } else if (lowerName.includes('chem')) {
    return { icon: 'droplet', color: '#F59E0B' };
  } else if (lowerName.includes('bio')) {
    return { icon: 'activity', color: '#8B5CF6' };
  } else {
    return { icon: 'book', color: '#64748B' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50
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
    marginTop: 20
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  subjectCard: {
    width: (width - 48) / 2,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  textContainer: {
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
  headerBlur: {
    paddingTop: StatusBar.currentHeight,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  headerContent: {
    paddingVertical: 8,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 300,
    padding: 32,
    borderRadius: 24,
    // Add transparency
    alignItems: 'center',
    borderWidth: 1,
    
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 300,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  logo: {
      fontSize: 28,
      fontWeight: '800',
      color: Colors.dark.primary,
      fontFamily: Platform.OS === "ios" ? "Poppins-Bold" : "sans-serif-light",
      letterSpacing: 0.5,
    },
});