import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ForumPost,
  LoadState,
  SchoolAnnouncement,
  TeacherNotification,
  UpdatesSnapshot,
} from "@/models/updates";
import { updatesRepository } from "@/services/mock/repositories";
import useSchoolStore from "@/utils/stores/schoolStore";

interface UpdatesContextValue {
  state: LoadState;
  error: string | null;
  forumPosts: ForumPost[];
  announcements: SchoolAnnouncement[];
  notifications: TeacherNotification[];
  unreadCount: number;
  reload: () => Promise<void>;
  markForumPostRead: (id: string) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  markAnnouncementRead: (id: string) => Promise<void>;
  openNotification: (id: string) => Promise<TeacherNotification | null>;
  markAllNotificationsRead: () => Promise<void>;
}

const UpdatesContext = createContext<UpdatesContextValue | undefined>(undefined);

const emptySnapshot: UpdatesSnapshot = {
  forumPosts: [],
  announcements: [],
  notifications: [],
};

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const schools = useSchoolStore((store) => store.schools);
  const assignedSchools = useMemo(
    () =>
      schools.filter(
        (school) =>
          school.status === "active" && school.pivot?.is_approved !== false,
      ),
    [schools],
  );
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      setSnapshot(await updatesRepository.getSnapshot());
      setState("ready");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load updates stored on this device.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const announcements = useMemo(
    () =>
      snapshot.announcements.map((announcement, index) => {
        const school =
          assignedSchools[index % Math.max(assignedSchools.length, 1)] ??
          assignedSchools[0] ??
          null;
        if (!school) return announcement;
        return {
          ...announcement,
          schoolId: school.id,
          schoolName: school.name,
          schoolAcronym: school.code || school.name.slice(0, 4).toUpperCase(),
        };
      }),
    [assignedSchools, snapshot.announcements],
  );

  const notifications = useMemo(
    () =>
      snapshot.notifications.map((notification, index) => {
        if (!notification.schoolId || assignedSchools.length === 0) return notification;
        const school =
          assignedSchools[index % assignedSchools.length] ?? assignedSchools[0];
        return { ...notification, schoolId: school.id, schoolName: school.name };
      }),
    [assignedSchools, snapshot.notifications],
  );

  const replaceForumPost = (post: ForumPost) => {
    setSnapshot((current) => ({
      ...current,
      forumPosts: current.forumPosts.map((item) =>
        item.id === post.id ? post : item,
      ),
    }));
  };

  const markForumPostRead = async (id: string) => {
    const post = await updatesRepository.markForumPostRead(id);
    if (post) replaceForumPost(post);
  };

  const toggleBookmark = async (id: string) => {
    const post = await updatesRepository.toggleForumBookmark(id);
    if (post) replaceForumPost(post);
  };

  const markAnnouncementRead = async (id: string) => {
    const announcement = await updatesRepository.markAnnouncementRead(id);
    if (!announcement) return;
    setSnapshot((current) => ({
      ...current,
      announcements: current.announcements.map((item) =>
        item.id === id ? announcement : item,
      ),
    }));
  };

  const openNotification = async (id: string) => {
    const notification = await updatesRepository.markNotificationRead(id);
    if (!notification) return null;
    setSnapshot((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? notification : item,
      ),
    }));
    return notification;
  };

  const markAllNotificationsRead = async () => {
    await updatesRepository.markAllNotificationsRead();
    setSnapshot((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({
        ...item,
        isRead: true,
      })),
    }));
  };

  const value = useMemo<UpdatesContextValue>(
    () => ({
      state,
      error,
      forumPosts: snapshot.forumPosts,
      announcements,
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
      reload,
      markForumPostRead,
      toggleBookmark,
      markAnnouncementRead,
      openNotification,
      markAllNotificationsRead,
    }),
    [announcements, error, notifications, snapshot.forumPosts, state, reload],
  );

  return (
    <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>
  );
}

export function useUpdates() {
  const context = useContext(UpdatesContext);
  if (!context) {
    throw new Error("useUpdates must be used inside UpdatesProvider");
  }
  return context;
}
