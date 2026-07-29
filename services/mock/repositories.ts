import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProfessionalProfile } from "@/models/professionalProfile";
import type {
  ForumPost,
  SchoolAnnouncement,
  TeacherNotification,
  UpdatesSnapshot,
} from "@/models/updates";
import {
  announcements,
  forumPosts,
  notifications,
  professionalProfile,
} from "./mockData";

const UPDATES_KEY = "mock_updates_repository_v1";
const PROFILE_KEY = "mock_professional_profile_repository_v1";

const waitForPreview = () => new Promise((resolve) => setTimeout(resolve, 180));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export interface UpdatesRepository {
  getSnapshot(): Promise<UpdatesSnapshot>;
  markForumPostRead(id: string): Promise<ForumPost | null>;
  toggleForumBookmark(id: string): Promise<ForumPost | null>;
  markAnnouncementRead(id: string): Promise<SchoolAnnouncement | null>;
  markNotificationRead(id: string): Promise<TeacherNotification | null>;
  markAllNotificationsRead(): Promise<void>;
}

export interface ProfessionalProfileRepository {
  get(): Promise<ProfessionalProfile>;
  save(profile: ProfessionalProfile): Promise<ProfessionalProfile>;
}

class AsyncStorageUpdatesRepository implements UpdatesRepository {
  private async read(): Promise<UpdatesSnapshot> {
    const stored = await AsyncStorage.getItem(UPDATES_KEY);
    if (!stored) {
      return {
        forumPosts: clone(forumPosts),
        announcements: clone(announcements),
        notifications: clone(notifications),
      };
    }
    try {
      return JSON.parse(stored) as UpdatesSnapshot;
    } catch {
      return {
        forumPosts: clone(forumPosts),
        announcements: clone(announcements),
        notifications: clone(notifications),
      };
    }
  }

  private async write(snapshot: UpdatesSnapshot) {
    await AsyncStorage.setItem(UPDATES_KEY, JSON.stringify(snapshot));
  }

  async getSnapshot() {
    await waitForPreview();
    return this.read();
  }

  async markForumPostRead(id: string) {
    const snapshot = await this.read();
    const post = snapshot.forumPosts.find((item) => item.id === id);
    if (!post) return null;
    post.isRead = true;
    await this.write(snapshot);
    return post;
  }

  async toggleForumBookmark(id: string) {
    const snapshot = await this.read();
    const post = snapshot.forumPosts.find((item) => item.id === id);
    if (!post) return null;
    post.isBookmarked = !post.isBookmarked;
    await this.write(snapshot);
    return post;
  }

  async markAnnouncementRead(id: string) {
    const snapshot = await this.read();
    const announcement = snapshot.announcements.find((item) => item.id === id);
    if (!announcement) return null;
    announcement.isRead = true;
    await this.write(snapshot);
    return announcement;
  }

  async markNotificationRead(id: string) {
    const snapshot = await this.read();
    const notification = snapshot.notifications.find((item) => item.id === id);
    if (!notification) return null;
    notification.isRead = true;
    await this.write(snapshot);
    return notification;
  }

  async markAllNotificationsRead() {
    const snapshot = await this.read();
    snapshot.notifications = snapshot.notifications.map((item) => ({
      ...item,
      isRead: true,
    }));
    await this.write(snapshot);
  }
}

class AsyncStorageProfessionalProfileRepository
  implements ProfessionalProfileRepository
{
  async get() {
    await waitForPreview();
    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    if (!stored) return clone(professionalProfile);
    try {
      return JSON.parse(stored) as ProfessionalProfile;
    } catch {
      return clone(professionalProfile);
    }
  }

  async save(profile: ProfessionalProfile) {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }
}

// TODO(api-integration): replace these instances with Laravel-backed implementations
// matching docs/FUTURE_LARAVEL_API_CONTRACTS.md.
export const updatesRepository: UpdatesRepository =
  new AsyncStorageUpdatesRepository();
export const professionalProfileRepository: ProfessionalProfileRepository =
  new AsyncStorageProfessionalProfileRepository();
