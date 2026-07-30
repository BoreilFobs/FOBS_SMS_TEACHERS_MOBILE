import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import Config from "@/constants/Config";
import { socialRepositories } from "@/social/services/repositories";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";

type SocialContextValue = {
  repository: typeof socialRepositories;
  snapshot: ReturnType<typeof socialRepositories.getSnapshot>;
  unreadMessages: number;
  unreadNotifications: number;
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const teacher = useUserStore((state) => state.teacher);
  const schools = useSchoolStore((state) => state.schools);
  const snapshot = useSyncExternalStore(
    socialRepositories.subscribe,
    socialRepositories.getSnapshot,
    socialRepositories.getSnapshot,
  );

  useEffect(() => {
    const photo = teacher?.profile_photo
      ? teacher.profile_photo.startsWith("http")
        ? teacher.profile_photo
        : `${Config.webBaseUrl}/storage/${teacher.profile_photo}`
      : undefined;
    socialRepositories.updateCurrentTeacher({
      name: user?.name || undefined,
      photoUrl: photo,
      biography: teacher?.bio || undefined,
      qualifications: teacher?.qualifications ? [teacher.qualifications] : undefined,
      subjects: teacher?.specialization
        ? teacher.specialization
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean)
        : undefined,
      yearsExperience: Number.parseInt(teacher?.experience ?? "", 10) || undefined,
      schoolNames: schools
        .filter((school) => school.status === "active" && school.pivot?.is_approved !== false)
        .map((school) => school.name),
    });
  }, [
    schools,
    teacher?.bio,
    teacher?.experience,
    teacher?.profile_photo,
    teacher?.qualifications,
    teacher?.specialization,
    user?.name,
  ]);

  const value = useMemo(
    () => ({
      repository: socialRepositories,
      snapshot,
      unreadMessages: snapshot.conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
      unreadNotifications: snapshot.notifications.filter(
        (notification) => !notification.read,
      ).length,
    }),
    [snapshot],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
}
