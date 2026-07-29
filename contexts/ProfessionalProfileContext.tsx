import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ProfessionalProfile } from "@/models/professionalProfile";
import type { LoadState } from "@/models/updates";
import { professionalProfileRepository } from "@/services/mock/repositories";

interface ProfessionalProfileContextValue {
  profile: ProfessionalProfile | null;
  state: LoadState;
  error: string | null;
  reload: () => Promise<void>;
  save: (profile: ProfessionalProfile) => Promise<void>;
  completion: number;
  totalExperience: number;
}

const ProfileContext = createContext<
  ProfessionalProfileContextValue | undefined
>(undefined);

function calculateExperience(profile: ProfessionalProfile | null) {
  if (!profile) return 0;
  const months = profile.experience.reduce((sum, entry) => {
    const start = new Date(entry.startDate);
    const end = entry.current ? new Date() : new Date(entry.endDate ?? start);
    const delta =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth();
    return sum + Math.max(0, delta);
  }, 0);
  return Math.round((months / 12) * 10) / 10;
}

function calculateCompletion(profile: ProfessionalProfile | null) {
  if (!profile) return 0;
  const checks = [
    profile.headline,
    profile.city,
    profile.biography,
    profile.primaryField,
    profile.subjects.length,
    profile.levels.length,
    profile.skills.length,
    profile.qualifications.length,
    profile.experience.length,
    profile.languages.length,
  ];
  return Math.round(
    (checks.filter((value) => Boolean(value)).length / checks.length) * 100,
  );
}

export function ProfessionalProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      setProfile(await professionalProfileRepository.get());
      setState("ready");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the professional profile.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async (nextProfile: ProfessionalProfile) => {
    setProfile(await professionalProfileRepository.save(nextProfile));
  };

  const value = useMemo(
    () => ({
      profile,
      state,
      error,
      reload,
      save,
      completion: calculateCompletion(profile),
      totalExperience: calculateExperience(profile),
    }),
    [error, profile, reload, state],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfessionalProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error(
      "useProfessionalProfile must be used inside ProfessionalProfileProvider",
    );
  }
  return context;
}

