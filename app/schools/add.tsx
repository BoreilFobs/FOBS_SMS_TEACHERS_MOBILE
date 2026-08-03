import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import {
  AppHeader,
  Button,
  Card,
  Chip,
  FormField,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import Config from "@/constants/Config";
import { radii, spacing, typography } from "@/constants/theme";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface SchoolInfo {
  id: number;
  name: string;
  logo: string;
  address: string;
  code: string;
}

/**
 * Join a school by its code. Two deliberate steps: look the school up, then
 * confirm it before sending — a teacher should never fire a request at a
 * school they have not seen the name of.
 */
export default function AddSchoolScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();

  const [schoolCode, setSchoolCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  const en = language === "en";
  const copy = en
    ? {
        title: "Add a school",
        subtitle: "Request access to manage classes",
        step1: "Step 1 · Enter the school code",
        step2: "Step 2 · Confirm the school",
        codeLabel: "School code",
        codePlaceholder: "e.g. GHS2024",
        codeHelp:
          "Ask your school administrator for the code. It is usually 4 to 10 characters.",
        find: "Find school",
        findAgain: "Search another code",
        send: "Send request",
        pending: "Your request will be reviewed by the school administrator.",
        codeTooShort: "School code must be at least 4 characters",
        loginAgain: "Please login again",
        notFound: "No school found with this code",
        networkError: "Network error occurred",
        sent: "Request sent",
        requests: "View pending requests",
      }
    : {
        title: "Ajouter une école",
        subtitle: "Demander l’accès pour gérer des classes",
        step1: "Étape 1 · Entrer le code de l’école",
        step2: "Étape 2 · Confirmer l’école",
        codeLabel: "Code de l’école",
        codePlaceholder: "ex : GHS2024",
        codeHelp:
          "Demandez le code à l’administrateur de votre école. Il comporte généralement 4 à 10 caractères.",
        find: "Rechercher l’école",
        findAgain: "Essayer un autre code",
        send: "Envoyer la demande",
        pending: "Votre demande sera examinée par l’administrateur de l’école.",
        codeTooShort: "Le code doit comporter au moins 4 caractères",
        loginAgain: "Veuillez vous reconnecter",
        notFound: "Aucune école trouvée avec ce code",
        networkError: "Erreur réseau",
        sent: "Demande envoyée",
        requests: "Voir les demandes en attente",
      };

  const handleVerifyCode = async () => {
    if (schoolCode.trim().length < 4) {
      setError(copy.codeTooShort);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSchoolInfo(null);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        setError(copy.loginAgain);
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${Config.apiBaseUrl}/teacher-request`,
        { code: schoolCode.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.success && response.data?.school) {
        setSchoolInfo(response.data.school);
        if (Platform.OS !== "web") {
          Toast.show({
            type: "success",
            text1: en ? "School found" : "École trouvée",
            text2: response.data.school.name,
            visibilityTime: 3000,
          });
        }
      } else {
        setError(response.data?.message || copy.notFound);
      }
    } catch (cause) {
      const message = axios.isAxiosError(cause)
        ? cause.response?.data?.message ||
          cause.response?.data?.error ||
          `Request failed with status ${cause.response?.status || "unknown"}`
        : copy.networkError;
      setError(message);
      if (Platform.OS !== "web") {
        Toast.show({
          type: "error",
          text1: en ? "Verification failed" : "Échec de la vérification",
          text2: message,
          visibilityTime: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!schoolInfo) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const teacherStr = await AsyncStorage.getItem("teacher");

      if (!token) {
        setError(copy.loginAgain);
        setIsSubmitting(false);
        return;
      }
      if (!teacherStr) {
        setError(
          en
            ? "Teacher information not found. Please complete your profile setup."
            : "Informations enseignant introuvables. Complétez votre profil.",
        );
        setIsSubmitting(false);
        router.push("/setup");
        return;
      }

      const teacher = JSON.parse(teacherStr);
      if (!teacher?.id) {
        setError(
          en
            ? "Invalid teacher data. Please login again."
            : "Données enseignant invalides. Reconnectez-vous.",
        );
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${Config.apiBaseUrl}/teacher-create-request`,
        { school_id: schoolInfo.id, teacher_id: teacher.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 201 || response.data?.success) {
        const successMessage = en
          ? `Your request to join ${schoolInfo.name} has been submitted.`
          : `Votre demande pour rejoindre ${schoolInfo.name} a été envoyée.`;

        setSchoolCode("");
        setSchoolInfo(null);
        setError(null);

        if (Platform.OS === "web") {
          showAlert(copy.sent, successMessage);
          router.replace("/schools/requests");
        } else {
          Toast.show({
            type: "success",
            text1: copy.sent,
            text2: successMessage,
            visibilityTime: 3000,
            onHide: () => router.replace("/schools/requests"),
          });
        }
      } else {
        setError(response.data?.message || "Failed to submit request");
      }
    } catch (cause) {
      // 409 means the teacher already has a request pending at this school.
      if (axios.isAxiosError(cause) && cause.response?.status === 409) {
        const message =
          cause.response?.data?.message ||
          (en
            ? "You have already sent a request to this school"
            : "Vous avez déjà envoyé une demande à cette école");
        setError(message);
        showAlert(en ? "Already requested" : "Demande déjà envoyée", message);
      } else {
        const message = axios.isAxiosError(cause)
          ? cause.response?.data?.message ||
            cause.response?.data?.error ||
            "Failed to submit request"
          : copy.networkError;
        setError(message);
        showAlert(en ? "Submission failed" : "Échec de l’envoi", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Screen scroll bottomInset={false}>
        <AppHeader title={copy.title} subtitle={copy.subtitle} back />

        <Card variant="raised" style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="home" size={26} color={colors.primary} />
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            {copy.codeHelp}
          </Text>
        </Card>

        <SectionHeader title={copy.step1} />
        <Card style={styles.form}>
          <FormField
            label={copy.codeLabel}
            value={schoolCode}
            onChangeText={(text) => {
              setSchoolCode(text.toUpperCase());
              setError(null);
            }}
            placeholder={copy.codePlaceholder}
            autoCapitalize="characters"
            autoCorrect={false}
            error={!schoolInfo && error ? error : undefined}
            editable={!schoolInfo}
          />
          {schoolInfo ? (
            <Button
              label={copy.findAgain}
              variant="secondary"
              icon="rotate-ccw"
              onPress={() => {
                setSchoolInfo(null);
                setError(null);
              }}
            />
          ) : (
            <Button
              label={copy.find}
              icon="search"
              loading={isLoading}
              disabled={schoolCode.trim().length < 4}
              onPress={() => void handleVerifyCode()}
            />
          )}
        </Card>

        {schoolInfo ? (
          <>
            <SectionHeader title={copy.step2} />
            <Card variant="raised" style={styles.form}>
              <View style={styles.schoolRow}>
                {schoolInfo.logo ? (
                  <Image
                    source={{ uri: schoolInfo.logo }}
                    style={[styles.logo, { backgroundColor: colors.surfaceMuted }]}
                  />
                ) : (
                  <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
                    <Feather name="home" size={22} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {schoolInfo.name}
                  </Text>
                  {schoolInfo.address ? (
                    <View style={styles.metaRow}>
                      <Feather name="map-pin" size={12} color={colors.textMuted} />
                      <Text
                        numberOfLines={2}
                        style={[typography.caption, { color: colors.textMuted, flex: 1 }]}
                      >
                        {schoolInfo.address}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.chipRow}>
                    <Chip label={schoolInfo.code} tone="primary" icon="hash" />
                  </View>
                </View>
              </View>

              <View style={[styles.notice, { backgroundColor: colors.infoSoft }]}>
                <Feather name="clock" size={15} color={colors.info} />
                <Text style={[typography.caption, { color: colors.info, flex: 1 }]}>
                  {copy.pending}
                </Text>
              </View>

              {error ? (
                <Text style={[typography.caption, { color: colors.error }]}>{error}</Text>
              ) : null}

              <Button
                label={copy.send}
                icon="send"
                loading={isSubmitting}
                onPress={() => void handleSubmitRequest()}
              />
            </Card>
          </>
        ) : null}

        <Button
          label={copy.requests}
          variant="secondary"
          icon="inbox"
          onPress={() => router.push("/schools/requests")}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: "center", gap: spacing.xs },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: spacing.sm },
  schoolRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  chipRow: { flexDirection: "row", marginTop: 2 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
});
