import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import { Button, Card, FilterChips, FormField } from "@/components/ui";
import Config from "@/constants/Config";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import { radii, spacing, typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SetupForm {
  qualifications: string;
  specialization: string;
  bio: string;
  phone: string;
  address: string;
  experience: number;
}

type TextField = Exclude<keyof SetupForm, "experience">;

export default function SetupRoute() {
  return (
    <AuthWrapper>
      <TeacherSetupScreen />
    </AuthWrapper>
  );
}

function TeacherSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const setTeacher = useUserStore((store) => store.setTeacher);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SetupForm>({
    qualifications: "",
    specialization: "",
    bio: "",
    phone: "",
    address: "",
    experience: 1,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SetupForm, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  const copy =
    language === "fr"
      ? {
          welcome: "Configurons votre profil enseignant",
          subtitle:
            "Ces informations sont requises par le compte existant. Vous pourrez développer votre profil professionnel ensuite.",
          next: "Continuer",
          back: "Retour",
          finish: "Terminer",
          required: "Ce champ est requis.",
          errorTitle: "Configuration impossible",
        }
      : {
          welcome: "Let’s set up your teacher profile",
          subtitle:
            "These details are required by the existing account. You can expand your professional profile later.",
          next: "Continue",
          back: "Back",
          finish: "Finish setup",
          required: "This field is required.",
          errorTitle: "Unable to complete setup",
        };

  const steps = useMemo(
    () =>
      language === "fr"
        ? [
            {
              title: "Parcours professionnel",
              description: "Résumez vos qualifications et votre domaine principal.",
              icon: "award" as const,
              fields: ["qualifications", "specialization"] as TextField[],
            },
            {
              title: "À propos de vous",
              description: "Présentez brièvement votre approche de l’enseignement.",
              icon: "file-text" as const,
              fields: ["bio"] as TextField[],
            },
            {
              title: "Coordonnées privées",
              description:
                "Ces informations restent privées et ne figurent pas sur le profil partagé.",
              icon: "shield" as const,
              fields: ["phone", "address"] as TextField[],
            },
            {
              title: "Expérience",
              description: "Indiquez votre nombre total d’années d’enseignement.",
              icon: "briefcase" as const,
              fields: [] as TextField[],
            },
          ]
        : [
            {
              title: "Professional background",
              description: "Summarize your qualifications and primary field.",
              icon: "award" as const,
              fields: ["qualifications", "specialization"] as TextField[],
            },
            {
              title: "About you",
              description: "Briefly describe your approach to teaching.",
              icon: "file-text" as const,
              fields: ["bio"] as TextField[],
            },
            {
              title: "Private contact details",
              description:
                "These details stay private and are not shown on the shared profile.",
              icon: "shield" as const,
              fields: ["phone", "address"] as TextField[],
            },
            {
              title: "Experience",
              description: "Select your total years of teaching experience.",
              icon: "briefcase" as const,
              fields: [] as TextField[],
            },
          ],
    [language],
  );

  const labels: Record<TextField, { en: string; fr: string }> = {
    qualifications: { en: "Qualifications", fr: "Qualifications" },
    specialization: { en: "Primary specialization", fr: "Spécialisation principale" },
    bio: { en: "Professional biography", fr: "Biographie professionnelle" },
    phone: { en: "Phone number", fr: "Numéro de téléphone" },
    address: { en: "Private address", fr: "Adresse privée" },
  };

  const validateStep = () => {
    const nextErrors: Partial<Record<keyof SetupForm, string>> = {};
    steps[step].fields.forEach((field) => {
      if (!form[field].trim()) nextErrors[field] = copy.required;
    });
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("auth_token");
      if (!userId || !token) {
        throw new Error(
          language === "fr"
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Your session expired. Please sign in again.",
        );
      }
      const payload = new FormData();
      payload.append("user_id", userId);
      payload.append("qualifications", form.qualifications.trim());
      payload.append("specialization", form.specialization.trim());
      payload.append("bio", form.bio.trim());
      payload.append("phone", form.phone.trim());
      payload.append("address", form.address.trim());
      payload.append("experience", String(form.experience));
      const response = await axios.post(
        `${Config.apiBaseUrl}/teacher/setup`,
        payload,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      await AsyncStorage.setItem("teacher", JSON.stringify(response.data.teacher));
      setTeacher(response.data.teacher);
      router.replace("/");
    } catch (submitError) {
      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ?? submitError.message
        : submitError instanceof Error
          ? submitError.message
          : language === "fr"
            ? "Veuillez réessayer."
            : "Please try again.";
      Alert.alert(copy.errorTitle, message);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === steps.length - 1) {
      void submit();
    } else {
      setStep((current) => current + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={[typography.heading, { color: colors.onPrimary }]}>F</Text>
          </View>
          <Text style={[typography.label, { color: colors.primary }]}>
            FobsSMS Teacher
          </Text>
        </View>
        <Text style={[typography.title, { color: colors.text }]}>
          {copy.welcome}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {copy.subtitle}
        </Text>
        <View
          accessibilityLabel={`Step ${step + 1} of ${steps.length}`}
          style={styles.progressRow}
        >
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progress,
                {
                  backgroundColor:
                    index <= step ? colors.primary : colors.surfaceMuted,
                },
              ]}
            />
          ))}
        </View>
        <Card style={styles.formCard}>
          <View
            style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name={steps[step].icon} size={25} color={colors.primary} />
          </View>
          <Text style={[typography.heading, { color: colors.text }]}>
            {steps[step].title}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {steps[step].description}
          </Text>
          {steps[step].fields.map((field) => (
            <FormField
              key={field}
              label={labels[field][language]}
              value={form[field]}
              onChangeText={(value) => {
                setForm((current) => ({ ...current, [field]: value }));
                setErrors((current) => ({ ...current, [field]: undefined }));
              }}
              multiline={field === "bio" || field === "address"}
              keyboardType={field === "phone" ? "phone-pad" : "default"}
              error={errors[field]}
            />
          ))}
          {step === steps.length - 1 ? (
            <>
              <Text style={[typography.label, { color: colors.text }]}>
                {language === "fr" ? "Années d’expérience" : "Years of experience"}
              </Text>
              <FilterChips
                options={[1, 2, 3, 5, 8, 10, 15, 20].map((value) => ({
                  value: String(value),
                  label: `${value}${value === 20 ? "+" : ""}`,
                }))}
                selected={String(form.experience)}
                onSelect={(value) =>
                  setForm((current) => ({
                    ...current,
                    experience: Number(value),
                  }))
                }
              />
            </>
          ) : null}
        </Card>
        <View style={styles.actions}>
          {step > 0 ? (
            <View style={{ flex: 1 }}>
              <Button
                label={copy.back}
                variant="secondary"
                onPress={() => setStep((current) => current - 1)}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label={step === steps.length - 1 ? copy.finish : copy.next}
              icon={step === steps.length - 1 ? "check" : "arrow-right"}
              loading={submitting}
              onPress={next}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  logo: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: { flexDirection: "row", gap: spacing.xs },
  progress: { flex: 1, height: 5, borderRadius: 3 },
  formCard: { gap: spacing.md },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: spacing.sm },
});
