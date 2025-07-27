import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Feather, FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSchools } from "@/hooks/useSchools";
import useUserStore from '@/utils/stores/userStore';
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 160;

export default function SchoolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const { user, teacher, loadUserData } = useUserStore();
  
  if (!teacher || !user) {
    loadUserData();
  }

  const { schoolData, loading, error, refetch } = useSchools(teacher?.id);

  const renderSchoolItem = ({ item }: { item: typeof schoolData[0] }) => (
    <TouchableOpacity
      style={[styles.schoolCard, { backgroundColor: colors.card }]}
      activeOpacity={0.9}
      onPress={() => router.push(`/(tabs)/subjects?schoolId=${item.school.id}`)}
    >
      <View style={styles.schoolContent}>
        <View style={styles.schoolLogoContainer}>
          {item.school.logo_url ? (
            <ImageBackground
              source={{ uri: item.school.logo_url }}
              style={styles.schoolLogo}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="school" size={40} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.schoolInfo}>
          <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1}>
            {item.school.name}
          </Text>
          <Text style={[styles.schoolAcronym, { color: colors.textSecondary }]}>
            {item.school.acronym}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          {!item.teacher_school.isActive ? (
            <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="pending" size={14} color="#E65100" />
              <Text style={[styles.statusText, { color: '#E65100' }]}>Pending</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
              <Feather name="check-circle" size={14} color="#2E7D32" />
              <Text style={[styles.statusText, { color: '#2E7D32' }]}>Active</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {item.school.address || 'No location specified'}
        </Text>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={styles.container}
        blurRadius={10}
      >
        <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={[styles.container, styles.errorContainer]}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={refetch}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return (
    <AuthWrapper>
      <SetupWrapper>
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={Platform.OS == 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Schools</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your connected institutions
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={() => router.push("settings")}
          >
            <FontAwesome name="gear" size={30} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/schools/add")}
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={schoolData}
        renderItem={renderSchoolItem}
        keyExtractor={(item) => item.school.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Schools not appearing? Wait for the school to accept request or send request to a school.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No schools connected to your account
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add a school to get started
            </Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/schools/add")}
            >
              <Text style={styles.addButtonText}>Connect School</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ImageBackground>
    </SetupWrapper>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  schoolCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  schoolContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  schoolAcronym: {
    fontSize: 14,
    opacity: 0.8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});