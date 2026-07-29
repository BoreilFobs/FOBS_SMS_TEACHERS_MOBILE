import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import {
  AppHeader,
  Button,
  Card,
  FilterChips,
  FormField,
  LoadingState,
  Screen,
  StatusChip,
} from "@/components/ui";
import { useProfessionalProfile } from "@/contexts/ProfessionalProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import type {
  Certification,
  ProfessionalDocument,
  ProfessionalExperience,
  ProfessionalLanguage,
  ProfessionalProfile,
  ProfileSectionKey,
  Qualification,
} from "@/models/professionalProfile";

type RecordSection =
  | "qualifications"
  | "certifications"
  | "experience"
  | "languages"
  | "documents";
type Draft = Record<string, string | boolean>;

interface FieldDefinition {
  key: string;
  labelEn: string;
  labelFr: string;
  placeholderEn?: string;
  placeholderFr?: string;
  required?: boolean;
  multiline?: boolean;
  inputMode?: "text" | "numeric" | "email" | "tel";
  choices?: string[];
  boolean?: boolean;
}

const sectionNames: Record<ProfileSectionKey, { en: string; fr: string }> = {
  summary: { en: "Professional summary", fr: "Résumé professionnel" },
  qualifications: { en: "Qualifications", fr: "Qualifications" },
  certifications: { en: "Certifications", fr: "Certifications" },
  experience: { en: "Professional experience", fr: "Expérience professionnelle" },
  specializations: { en: "Teaching specializations", fr: "Spécialisations" },
  skills: { en: "Skills and competencies", fr: "Compétences" },
  languages: { en: "Languages", fr: "Langues" },
  documents: { en: "Private documents", fr: "Documents privés" },
  visibility: { en: "Visibility and preferences", fr: "Visibilité et préférences" },
};

const recordFields: Record<RecordSection, FieldDefinition[]> = {
  qualifications: [
    { key: "degree", labelEn: "Degree or qualification", labelFr: "Diplôme ou qualification", required: true },
    { key: "field", labelEn: "Field of study", labelFr: "Domaine d’études", required: true },
    { key: "institution", labelEn: "Institution", labelFr: "Établissement", required: true },
    { key: "location", labelEn: "Country or location", labelFr: "Pays ou lieu", required: true },
    { key: "graduationYear", labelEn: "Graduation year", labelFr: "Année d’obtention", required: true, inputMode: "numeric" },
    { key: "distinction", labelEn: "Grade or distinction", labelFr: "Mention", placeholderEn: "Optional", placeholderFr: "Facultatif" },
  ],
  certifications: [
    { key: "name", labelEn: "Certification name", labelFr: "Nom de la certification", required: true },
    { key: "issuer", labelEn: "Issuing organization", labelFr: "Organisme émetteur", required: true },
    { key: "issueDate", labelEn: "Issue date (YYYY-MM-DD)", labelFr: "Date d’émission (AAAA-MM-JJ)", required: true },
    { key: "expirationDate", labelEn: "Expiration date (YYYY-MM-DD)", labelFr: "Date d’expiration (AAAA-MM-JJ)" },
    { key: "credentialNumber", labelEn: "Credential number", labelFr: "Numéro du certificat" },
  ],
  experience: [
    { key: "organization", labelEn: "School or organization", labelFr: "École ou organisation", required: true },
    { key: "role", labelEn: "Role", labelFr: "Fonction", required: true },
    { key: "subjects", labelEn: "Subjects taught", labelFr: "Matières enseignées", placeholderEn: "Comma separated", placeholderFr: "Séparées par des virgules" },
    { key: "levels", labelEn: "Educational levels", labelFr: "Niveaux d’enseignement", placeholderEn: "Comma separated", placeholderFr: "Séparés par des virgules" },
    { key: "startDate", labelEn: "Start date (YYYY-MM-DD)", labelFr: "Date de début (AAAA-MM-JJ)", required: true },
    { key: "current", labelEn: "I currently work here", labelFr: "J’y travaille actuellement", boolean: true },
    { key: "endDate", labelEn: "End date (YYYY-MM-DD)", labelFr: "Date de fin (AAAA-MM-JJ)" },
    { key: "responsibilities", labelEn: "Responsibilities", labelFr: "Responsabilités", multiline: true, required: true },
    { key: "achievements", labelEn: "Achievements", labelFr: "Réalisations", multiline: true },
  ],
  languages: [
    { key: "name", labelEn: "Language", labelFr: "Langue", required: true },
    { key: "spoken", labelEn: "Spoken proficiency", labelFr: "Niveau oral", required: true, choices: ["Basic", "Intermediate", "Advanced", "Fluent"] },
    { key: "written", labelEn: "Written proficiency", labelFr: "Niveau écrit", required: true, choices: ["Basic", "Intermediate", "Advanced", "Fluent"] },
    { key: "usedForTeaching", labelEn: "Used for teaching", labelFr: "Utilisée pour enseigner", boolean: true },
  ],
  documents: [
    { key: "kind", labelEn: "Document type", labelFr: "Type de document", required: true, choices: ["CV", "Degree certificate", "Professional certificate", "Other"] },
    { key: "title", labelEn: "Document title", labelFr: "Titre du document", required: true },
    { key: "updatedAt", labelEn: "Document date (YYYY-MM-DD)", labelFr: "Date du document (AAAA-MM-JJ)", required: true },
  ],
};

export default function ProfileSectionRoute() {
  return (
    <AuthWrapper>
      <ProfileSectionEditor />
    </AuthWrapper>
  );
}

function ProfileSectionEditor() {
  const { section: rawSection } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { profile, state, save } = useProfessionalProfile();
  const section = rawSection as ProfileSectionKey;
  const valid = Object.prototype.hasOwnProperty.call(sectionNames, section);
  const [draftProfile, setDraftProfile] = useState<ProfessionalProfile | null>(profile);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setDraftProfile(profile);
  }, [profile]);

  const copy = {
    save: language === "fr" ? "Enregistrer" : "Save changes",
    saved: language === "fr" ? "Enregistré" : "Saved",
    discardTitle:
      language === "fr" ? "Ignorer les modifications ?" : "Discard changes?",
    discardMessage:
      language === "fr"
        ? "Les modifications non enregistrées seront perdues."
        : "Your unsaved changes will be lost.",
    keep: language === "fr" ? "Continuer" : "Keep editing",
    discard: language === "fr" ? "Ignorer" : "Discard",
  };

  const requestBack = () => {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert(copy.discardTitle, copy.discardMessage, [
      { text: copy.keep, style: "cancel" },
      { text: copy.discard, style: "destructive", onPress: () => router.back() },
    ]);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [dirty]);

  if (state === "idle" || state === "loading" || !draftProfile) {
    return (
      <Screen bottomInset={false}>
        <LoadingState rows={5} />
      </Screen>
    );
  }
  if (!valid) {
    return (
      <Screen bottomInset={false}>
        <AppHeader title="Profile" onBack={() => router.back()} />
      </Screen>
    );
  }

  const updateProfile = (next: ProfessionalProfile) => {
    setDraftProfile(next);
    setDirty(true);
    setSaved(false);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save(draftProfile);
      setDirty(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={sectionNames[section][language]}
        subtitle={
          language === "fr"
            ? "Les champs marqués requis doivent être complétés."
            : "Complete all fields marked as required."
        }
        onBack={requestBack}
      />
      {section === "summary" ? (
        <SummaryEditor profile={draftProfile} update={updateProfile} />
      ) : section === "specializations" ? (
        <SpecializationEditor profile={draftProfile} update={updateProfile} />
      ) : section === "skills" ? (
        <SkillsEditor profile={draftProfile} update={updateProfile} />
      ) : section === "visibility" ? (
        <VisibilityEditor profile={draftProfile} update={updateProfile} />
      ) : (
        <RecordEditor
          section={section as RecordSection}
          profile={draftProfile}
          update={updateProfile}
        />
      )}
      <View style={styles.saveRow}>
        <Button
          label={saved ? copy.saved : copy.save}
          icon={saved ? "check" : "save"}
          onPress={() => void submit()}
          loading={saving}
          disabled={!dirty && !saved}
        />
      </View>
      {section === "documents" ? (
        <Card>
          <View style={styles.notice}>
            <Feather name="lock" size={20} color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>
              {language === "fr"
                ? "Seules les métadonnées sont enregistrées pour le moment. Aucun fichier n’est téléversé et les documents restent privés."
                : "Only metadata is saved for now. No file is uploaded, and documents remain private."}
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function SummaryEditor({
  profile,
  update,
}: {
  profile: ProfessionalProfile;
  update: (profile: ProfessionalProfile) => void;
}) {
  const { language } = useLanguage();
  return (
    <>
      <FormField
        label={language === "fr" ? "Titre professionnel" : "Professional headline"}
        value={profile.headline}
        onChangeText={(headline) => update({ ...profile, headline })}
        placeholder={
          language === "fr"
            ? "Ex. Enseignant de mathématiques"
            : "e.g. Mathematics teacher"
        }
      />
      <FormField
        label={language === "fr" ? "Ville" : "City"}
        value={profile.city}
        onChangeText={(city) => update({ ...profile, city })}
      />
      <FormField
        label={language === "fr" ? "Biographie professionnelle" : "Professional biography"}
        value={profile.biography}
        onChangeText={(biography) => update({ ...profile, biography })}
        multiline
      />
    </>
  );
}

function SpecializationEditor({
  profile,
  update,
}: {
  profile: ProfessionalProfile;
  update: (profile: ProfessionalProfile) => void;
}) {
  const { language } = useLanguage();
  const fields: Array<{
    key: "additionalFields" | "subjects" | "levels" | "expertise" | "teachingLanguages";
    en: string;
    fr: string;
  }> = [
    { key: "additionalFields", en: "Additional teaching fields", fr: "Domaines supplémentaires" },
    { key: "subjects", en: "Subjects taught", fr: "Matières enseignées" },
    { key: "levels", en: "Educational levels", fr: "Niveaux d’enseignement" },
    { key: "expertise", en: "Areas of expertise", fr: "Domaines d’expertise" },
    { key: "teachingLanguages", en: "Languages used for teaching", fr: "Langues d’enseignement" },
  ];
  return (
    <>
      <FormField
        label={language === "fr" ? "Domaine principal" : "Primary teaching field"}
        value={profile.primaryField}
        onChangeText={(primaryField) => update({ ...profile, primaryField })}
      />
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={language === "fr" ? field.fr : field.en}
          value={profile[field.key].join(", ")}
          onChangeText={(value) =>
            update({ ...profile, [field.key]: splitValues(value) })
          }
          placeholder={
            language === "fr"
              ? "Séparer par des virgules"
              : "Separate values with commas"
          }
        />
      ))}
    </>
  );
}

function SkillsEditor({
  profile,
  update,
}: {
  profile: ProfessionalProfile;
  update: (profile: ProfessionalProfile) => void;
}) {
  const { language } = useLanguage();
  const suggestions = [
    "Classroom management",
    "Lesson planning",
    "Student assessment",
    "Curriculum development",
    "Digital teaching tools",
    "Inclusive education",
    "Communication",
    "Leadership",
  ];
  return (
    <>
      <FormField
        label={language === "fr" ? "Compétences" : "Skills and competencies"}
        value={profile.skills.join(", ")}
        onChangeText={(value) => update({ ...profile, skills: splitValues(value) })}
        multiline
        placeholder={
          language === "fr"
            ? "Séparer par des virgules"
            : "Separate skills with commas"
        }
      />
      <View style={styles.suggestions}>
        {suggestions.map((skill) => {
          const active = profile.skills.includes(skill);
          return (
            <Pressable
              key={skill}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() =>
                update({
                  ...profile,
                  skills: active
                    ? profile.skills.filter((item) => item !== skill)
                    : [...profile.skills, skill],
                })
              }
            >
              <StatusChip
                label={skill}
                tone={active ? "info" : "neutral"}
                icon={active ? "check" : "plus"}
              />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function VisibilityEditor({
  profile,
  update,
}: {
  profile: ProfessionalProfile;
  update: (profile: ProfessionalProfile) => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const options: Array<{
    key: keyof ProfessionalProfile["visibility"];
    titleEn: string;
    titleFr: string;
    subtitleEn: string;
    subtitleFr: string;
  }> = [
    {
      key: "currentSchools",
      titleEn: "Show current schools",
      titleFr: "Afficher les écoles actuelles",
      subtitleEn: "Only schools allowed by assignment rules are shown.",
      subtitleFr: "Seules les écoles autorisées par les règles d’affectation sont affichées.",
    },
    {
      key: "professionalEmail",
      titleEn: "Show professional email",
      titleFr: "Afficher l’email professionnel",
      subtitleEn: "Your private account email is never used automatically.",
      subtitleFr: "L’email privé du compte n’est jamais utilisé automatiquement.",
    },
    {
      key: "professionalPhone",
      titleEn: "Show professional phone",
      titleFr: "Afficher le téléphone professionnel",
      subtitleEn: "Your private phone remains hidden.",
      subtitleFr: "Votre téléphone privé reste masqué.",
    },
  ];
  return (
    <>
      <FormField
        label={language === "fr" ? "Email professionnel" : "Professional email"}
        value={profile.professionalEmail ?? ""}
        onChangeText={(professionalEmail) => update({ ...profile, professionalEmail })}
        keyboardType="email-address"
        autoCapitalize="none"
        optional
      />
      <FormField
        label={language === "fr" ? "Téléphone professionnel" : "Professional phone"}
        value={profile.professionalPhone ?? ""}
        onChangeText={(professionalPhone) => update({ ...profile, professionalPhone })}
        keyboardType="phone-pad"
        optional
      />
      {options.map((option) => (
        <Card key={option.key}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {language === "fr" ? option.titleFr : option.titleEn}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {language === "fr" ? option.subtitleFr : option.subtitleEn}
              </Text>
            </View>
            <Switch
              value={profile.visibility[option.key]}
              onValueChange={(value) =>
                update({
                  ...profile,
                  visibility: { ...profile.visibility, [option.key]: value },
                })
              }
              trackColor={{ false: colors.disabled, true: colors.primary }}
            />
          </View>
        </Card>
      ))}
    </>
  );
}

function RecordEditor({
  section,
  profile,
  update,
}: {
  section: RecordSection;
  profile: ProfessionalProfile;
  update: (profile: ProfessionalProfile) => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const records = profile[section] as Array<{ id: string }>;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fields = recordFields[section];

  const beginAdd = () => {
    const initial: Draft = {};
    fields.forEach((field) => {
      initial[field.key] = field.boolean ? false : field.choices?.[0] ?? "";
    });
    if (section === "documents") {
      initial.updatedAt = new Date().toISOString().slice(0, 10);
    }
    setEditingId(null);
    setDraft(initial);
    setErrors({});
  };

  const beginEdit = (record: { id: string }) => {
    setEditingId(record.id);
    setDraft(recordToDraft(section, record));
    setErrors({});
  };

  const commit = () => {
    if (!draft) return;
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !String(draft[field.key] ?? "").trim()) {
        nextErrors[field.key] =
          language === "fr" ? "Ce champ est requis." : "This field is required.";
      }
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const id = editingId ?? `${section}-${Date.now()}`;
    const record = draftToRecord(section, id, draft);
    const nextRecords = editingId
      ? records.map((item) => (item.id === editingId ? record : item))
      : [...records, record];
    update({ ...profile, [section]: nextRecords } as ProfessionalProfile);
    setDraft(null);
    setEditingId(null);
  };

  const remove = (id: string) => {
    Alert.alert(
      language === "fr" ? "Supprimer l’entrée ?" : "Remove this entry?",
      language === "fr"
        ? "Cette modification sera appliquée lorsque vous enregistrerez la section."
        : "This change will be applied when you save the section.",
      [
        { text: language === "fr" ? "Annuler" : "Cancel", style: "cancel" },
        {
          text: language === "fr" ? "Supprimer" : "Remove",
          style: "destructive",
          onPress: () =>
            update({
              ...profile,
              [section]: records.filter((item) => item.id !== id),
            } as ProfessionalProfile),
        },
      ],
    );
  };

  return (
    <>
      <View style={styles.list}>
        {records.map((record) => {
          const summary = recordSummary(section, record);
          return (
            <Card key={record.id} onPress={() => beginEdit(record)}>
              <View style={styles.recordRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {summary.title}
                  </Text>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {summary.subtitle}
                  </Text>
                  {summary.detail ? (
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {summary.detail}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={language === "fr" ? "Supprimer" : "Remove"}
                  onPress={(event) => {
                    event.stopPropagation();
                    remove(record.id);
                  }}
                  style={[styles.deleteButton, { backgroundColor: colors.errorSoft }]}
                >
                  <Feather name="trash-2" size={18} color={colors.error} />
                </Pressable>
              </View>
            </Card>
          );
        })}
      </View>
      {!draft ? (
        <Button
          label={language === "fr" ? "Ajouter une entrée" : "Add entry"}
          icon="plus"
          variant="secondary"
          onPress={beginAdd}
        />
      ) : (
        <Card style={styles.formCard}>
          <Text style={[typography.heading, { color: colors.text }]}>
            {editingId
              ? language === "fr"
                ? "Modifier l’entrée"
                : "Edit entry"
              : language === "fr"
                ? "Nouvelle entrée"
                : "New entry"}
          </Text>
          {fields.map((field) =>
            field.boolean ? (
              <View key={field.key} style={styles.switchRow}>
                <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
                  {language === "fr" ? field.labelFr : field.labelEn}
                </Text>
                <Switch
                  value={Boolean(draft[field.key])}
                  onValueChange={(value) =>
                    setDraft({ ...draft, [field.key]: value })
                  }
                  trackColor={{ false: colors.disabled, true: colors.primary }}
                />
              </View>
            ) : field.choices ? (
              <View key={field.key} style={styles.choiceField}>
                <Text style={[typography.label, { color: colors.text }]}>
                  {language === "fr" ? field.labelFr : field.labelEn}
                </Text>
                <FilterChips
                  options={field.choices.map((choice) => ({
                    value: choice,
                    label: choice,
                  }))}
                  selected={String(draft[field.key] ?? field.choices[0])}
                  onSelect={(value) =>
                    setDraft({ ...draft, [field.key]: value })
                  }
                />
              </View>
            ) : (
              <FormField
                key={field.key}
                label={language === "fr" ? field.labelFr : field.labelEn}
                value={String(draft[field.key] ?? "")}
                onChangeText={(value) =>
                  setDraft({ ...draft, [field.key]: value })
                }
                placeholder={
                  language === "fr"
                    ? field.placeholderFr
                    : field.placeholderEn
                }
                multiline={field.multiline}
                inputMode={field.inputMode}
                optional={!field.required}
                error={errors[field.key]}
              />
            ),
          )}
          <View style={styles.formActions}>
            <View style={{ flex: 1 }}>
              <Button
                label={language === "fr" ? "Annuler" : "Cancel"}
                variant="secondary"
                onPress={() => setDraft(null)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={language === "fr" ? "Appliquer" : "Apply"}
                onPress={commit}
              />
            </View>
          </View>
        </Card>
      )}
    </>
  );
}

function splitValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function recordToDraft(section: RecordSection, record: { id: string }): Draft {
  const source = record as unknown as Record<string, unknown>;
  const draft: Draft = {};
  recordFields[section].forEach((field) => {
    const value = source[field.key];
    draft[field.key] = Array.isArray(value)
      ? value.join(", ")
      : typeof value === "boolean"
        ? value
        : String(value ?? "");
  });
  return draft;
}

function draftToRecord(section: RecordSection, id: string, draft: Draft) {
  if (section === "qualifications") {
    return {
      id,
      degree: String(draft.degree),
      field: String(draft.field),
      institution: String(draft.institution),
      location: String(draft.location),
      graduationYear: Number(draft.graduationYear),
      distinction: String(draft.distinction || "") || undefined,
      documentStatus: "not-added",
    } satisfies Qualification;
  }
  if (section === "certifications") {
    return {
      id,
      name: String(draft.name),
      issuer: String(draft.issuer),
      issueDate: String(draft.issueDate),
      expirationDate: String(draft.expirationDate || "") || undefined,
      credentialNumber: String(draft.credentialNumber || "") || undefined,
      status: "self-declared",
    } satisfies Certification;
  }
  if (section === "experience") {
    return {
      id,
      organization: String(draft.organization),
      role: String(draft.role),
      subjects: splitValues(String(draft.subjects || "")),
      levels: splitValues(String(draft.levels || "")),
      startDate: String(draft.startDate),
      endDate: Boolean(draft.current)
        ? undefined
        : String(draft.endDate || "") || undefined,
      current: Boolean(draft.current),
      responsibilities: String(draft.responsibilities),
      achievements: String(draft.achievements || "") || undefined,
    } satisfies ProfessionalExperience;
  }
  if (section === "languages") {
    return {
      id,
      name: String(draft.name),
      spoken: String(draft.spoken) as ProfessionalLanguage["spoken"],
      written: String(draft.written) as ProfessionalLanguage["written"],
      usedForTeaching: Boolean(draft.usedForTeaching),
    } satisfies ProfessionalLanguage;
  }
  return {
    id,
    kind: String(draft.kind) as ProfessionalDocument["kind"],
    title: String(draft.title),
    updatedAt: String(draft.updatedAt),
    status: "metadata-only",
    private: true,
  } satisfies ProfessionalDocument;
}

function recordSummary(section: RecordSection, record: { id: string }) {
  if (section === "qualifications") {
    const item = record as Qualification;
    return {
      title: item.degree,
      subtitle: `${item.field} · ${item.institution}`,
      detail: `${item.location} · ${item.graduationYear}`,
    };
  }
  if (section === "certifications") {
    const item = record as Certification;
    return { title: item.name, subtitle: item.issuer, detail: item.issueDate };
  }
  if (section === "experience") {
    const item = record as ProfessionalExperience;
    return {
      title: item.role,
      subtitle: item.organization,
      detail: `${item.startDate} – ${item.current ? "Present" : item.endDate ?? ""}`,
    };
  }
  if (section === "languages") {
    const item = record as ProfessionalLanguage;
    return {
      title: item.name,
      subtitle: `Spoken: ${item.spoken} · Written: ${item.written}`,
      detail: item.usedForTeaching ? "Used for teaching" : "",
    };
  }
  const item = record as ProfessionalDocument;
  return {
    title: item.title,
    subtitle: item.kind,
    detail: `${item.updatedAt} · Private metadata`,
  };
}

const styles = StyleSheet.create({
  saveRow: { marginTop: spacing.sm },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  list: { gap: spacing.sm },
  recordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: { gap: spacing.md },
  choiceField: { gap: spacing.xs },
  formActions: { flexDirection: "row", gap: spacing.sm },
  notice: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

