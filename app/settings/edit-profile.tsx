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
import * as ImagePicker from "expo-image-picker";
import { appendImageToFormData, pickImageFromLibrary, type PickedImage } from "@/utils/imageUpload";
import { authFetch } from "@/services/authFetch";
import { resolveMediaUrl } from "@/utils/photoUri";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Button,
  Card,
  FormField,
  PressableScale,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import Config from "@/constants/Config";
import { radii, spacing, typography } from "@/constants/theme";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { user, teacher, updateTeacher } = useUserStore();

  const [formData, setFormData] = useState({
    email: user?.email || "",
    qualifications: teacher?.qualifications || "",
    specialization: teacher?.specialization || "",
    experience: teacher?.experience || "",
    phone: teacher?.phone || "",
    address: teacher?.address || "",
    bio: teacher?.bio || "",
  });
  // `storedPhoto` is what the server has; `pickedPhoto` is a not-yet-uploaded
  // local selection that takes precedence in the preview.
  const [storedPhoto] = useState(teacher?.profile_photo || null);
  const [pickedPhoto, setPickedPhoto] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);

  const en = language === "en";

  const copy = en
    ? {
        title: "Personal information",
        subtitle: "Name, photo, phone, and private information",
        photo: "Profile photo",
        photoDenied: "Photo access is required to change your picture.",
        photoHint: "Tap the photo to change it",
        contact: "Contact details",
        professional: "Professional details",
        about: "About you",
        email: "Email",
        qualifications: "Qualifications",
        specialization: "Specialization",
        experience: "Experience",
        phone: "Phone",
        address: "Address",
        bio: "Bio",
        save: "Save changes",
        emailRequired: "Email is required",
        emailInvalid: "Please enter a valid email",
        emailTaken: "This email is already registered to another account.",
        emailWarning: "Changing your email will change how you sign in.",
        success: "Profile updated successfully!",
        failure: "Failed to update profile",
        error: "An error occurred while updating your profile",
      }
    : {
        title: "Informations personnelles",
        subtitle: "Nom, photo, téléphone et informations privées",
        photo: "Photo de profil",
        photoDenied: "L’accès aux photos est requis pour changer votre image.",
        photoHint: "Appuyez sur la photo pour la changer",
        contact: "Coordonnées",
        professional: "Informations professionnelles",
        about: "À propos de vous",
        email: "Email",
        qualifications: "Qualifications",
        specialization: "Spécialisation",
        experience: "Expérience",
        phone: "Téléphone",
        address: "Adresse",
        bio: "Biographie",
        save: "Enregistrer",
        emailRequired: "L'email est obligatoire",
        emailInvalid: "Veuillez entrer un email valide",
        emailTaken: "Cet email est déjà associé à un autre compte.",
        emailWarning: "Changer votre email modifiera votre identifiant de connexion.",
        success: "Profil mis à jour avec succès !",
        failure: "Échec de la mise à jour du profil",
        error: "Une erreur est survenue lors de la mise à jour de votre profil",
      };

  const handleEmailChange = (text: string) => {
    setFormData({ ...formData, email: text });
    setEmailChanged(text !== user?.email);
    setEmailError("");
  };

  const pickImage = async () => {
    const image = await pickImageFromLibrary();
    if (image) setPickedPhoto(image);
    else if (Platform.OS !== "web") {
      // Distinguish "cancelled" from "denied" only when it matters.
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) showAlert(copy.photo, copy.photoDenied);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.email.trim()) {
      setEmailError(copy.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailError(copy.emailInvalid);
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      if (user?.id) {
        formDataToSend.append("user_id", user.id.toString());
      }
      formDataToSend.append("email", formData.email);
      formDataToSend.append("qualifications", formData.qualifications);
      formDataToSend.append("specialization", formData.specialization);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("bio", formData.bio);

      if (pickedPhoto) {
        await appendImageToFormData(formDataToSend, "profile_photo", pickedPhoto);
      }

      // authFetch attaches the bearer token and leaves FormData boundaries to
      // the platform — setting Content-Type by hand here breaks the upload.
      const response = await authFetch(`${Config.apiBaseUrl}/teacher/update-profile`, {
        method: "POST",
        body: formDataToSend,
      });
      const data = await response.json();

      if (data.success) {
        updateTeacher(data.teacher);
        if (data.user) {
          useUserStore.getState().updateUser(data.user);
        }
        showAlert(en ? "Success" : "Succès", copy.success);
        router.back();
      } else if (data.message && data.message.toLowerCase().includes("email")) {
        setEmailError(copy.emailTaken);
      } else {
        showAlert(en ? "Error" : "Erreur", data.message || copy.failure);
      }
    } catch (error) {
      showAlert(en ? "Error" : "Erreur", copy.error);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const photoUri = pickedPhoto?.uri ?? resolveMediaUrl(storedPhoto);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Screen scroll bottomInset={false}>
        <AppHeader title={copy.title} subtitle={copy.subtitle} back />

        <Card variant="raised" style={styles.photoCard}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={copy.photo}
            onPress={() => void pickImage()}
            style={styles.photoPress}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, { backgroundColor: colors.primarySoft }]}>
                <Feather name="user" size={34} color={colors.primary} />
              </View>
            )}
            <View
              style={[
                styles.editBadge,
                { backgroundColor: colors.primary, borderColor: colors.surface },
              ]}
            >
              <Feather name="camera" size={13} color={colors.onPrimary} />
            </View>
          </PressableScale>
          <Text style={[typography.heading, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {copy.photoHint}
          </Text>
        </Card>

        <SectionHeader title={copy.contact} />
        <Card style={styles.form}>
          <FormField
            label={copy.email}
            value={formData.email}
            onChangeText={handleEmailChange}
            error={emailError || undefined}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailChanged && !emailError ? (
            <Text style={[typography.caption, { color: colors.warning }]}>
              {copy.emailWarning}
            </Text>
          ) : null}
          <FormField
            label={copy.phone}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder={en ? "Enter your phone number" : "Entrez votre numéro"}
            keyboardType="phone-pad"
          />
          <FormField
            label={copy.address}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder={en ? "Enter your address" : "Entrez votre adresse"}
          />
        </Card>

        <SectionHeader title={copy.professional} />
        <Card style={styles.form}>
          <FormField
            label={copy.qualifications}
            value={formData.qualifications}
            onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
            placeholder={en ? "e.g. BSc Mathematics" : "ex : Licence en mathématiques"}
          />
          <FormField
            label={copy.specialization}
            value={formData.specialization}
            onChangeText={(text) => setFormData({ ...formData, specialization: text })}
            placeholder={en ? "e.g. Applied Physics" : "ex : Physique appliquée"}
          />
          <FormField
            label={copy.experience}
            value={formData.experience}
            onChangeText={(text) => setFormData({ ...formData, experience: text })}
            placeholder={en ? "e.g. 5 years" : "ex : 5 ans"}
          />
        </Card>

        <SectionHeader title={copy.about} />
        <Card>
          <FormField
            label={copy.bio}
            multiline
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder={en ? "Tell us about yourself..." : "Parlez-nous de vous..."}
          />
        </Card>

        <Button
          label={copy.save}
          icon="check"
          loading={isLoading}
          onPress={() => void handleUpdateProfile()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photoCard: { alignItems: "center", gap: spacing.xxs },
  photoPress: { marginBottom: spacing.xs },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: spacing.sm },
});
