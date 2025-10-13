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
  RefreshControl,
  Platform,
  useColorScheme
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useUserStore from '@/utils/stores/userStore';
import Config from '@/constants/Config';

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.4;

interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}

export default function ClassSelectionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { teacher } = useUserStore();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = params.schoolId as string;
  const teacherId = teacher?.id;
  const subjectId = params.subjectId as string;
  console.log(`Fetching classes for schoolId: ${schoolId}, teacherId: ${teacherId}, subjectId: ${subjectId}`);

  const fetchClasses = async () => {
    
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.apiBaseUrl}/teacher-classes?school_id=${schoolId}&teacher_id=${teacherId}&subject_id=${subjectId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.data);
      } else {
        setError(data.message || 'Failed to fetch classes');
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
    fetchClasses();
  };

  useEffect(() => {
    if (schoolId && teacherId && subjectId) {
      fetchClasses();
    }
  }, [schoolId, teacherId, subjectId]);

  const renderClassCard = ({ item }: { item: Class }) => {
    const classConfig = getClassConfig(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.classCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.9}
        onPress={() => router.push(`/marks/exams?class_id=${item.id}&school_id=${schoolId}&subject_id=${subjectId}`)}
      >
        <LinearGradient
          colors={[classConfig.color + '30', classConfig.color + '10']}
          style={styles.iconContainer}
        >
          <Feather name={classConfig.icon} size={28} color={classConfig.color} />
        </LinearGradient>
        
        <View style={styles.textContainer}>
          <Text style={[styles.className, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.classDetails, { color: colors.textSecondary }]}>
            {item.level} • {item.academic_year}
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
            onPress={fetchClasses}
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
        <Text style={[styles.title, { color: colors.text }]}>Select Class</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose a class to continue
        </Text>
      </View>

      <FlatList
        data={classes}
        renderItem={renderClassCard}
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
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No classes assigned
            </Text>
          </View>
        }
      />
    </ImageBackground>
  );
}

// Helper function to get icon and color based on class
function getClassConfig(className: string) {
  const lowerName = className.toLowerCase();
  
  if (lowerName.includes('form 1')) {
    return { icon: 'users', color: '#6366F1' };
  } else if (lowerName.includes('form 2')) {
    return { icon: 'users', color: '#10B981' };
  } else if (lowerName.includes('form 3')) {
    return { icon: 'users', color: '#EF4444' };
  } else if (lowerName.includes('form 4')) {
    return { icon: 'users', color: '#F59E0B' };
  } else {
    return { icon: 'users', color: '#64748B' };
  }
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
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  classCard: {
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
  className: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  classDetails: {
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
});