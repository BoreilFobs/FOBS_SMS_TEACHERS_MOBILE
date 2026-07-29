export type LoadState = "idle" | "loading" | "ready" | "error";

export type ForumCategory =
  | "Pedagogy"
  | "Assessment"
  | "Inclusive education"
  | "Digital learning"
  | "Professional development";

export interface ForumAuthor {
  id: string;
  name: string;
  headline: string;
  verified: boolean;
}

export interface ForumAttachment {
  id: string;
  title: string;
  kind: "pdf" | "link" | "document";
  size?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  excerpt: string;
  content: string[];
  category: ForumCategory;
  author: ForumAuthor;
  publishedAt: string;
  readingMinutes: number;
  featured: boolean;
  pinned: boolean;
  isRead: boolean;
  isBookmarked: boolean;
  coverImage?: string;
  attachments: ForumAttachment[];
  relatedPostIds: string[];
}

export interface ForumPermissions {
  canPublish: boolean;
  canComment: boolean;
  canReact: boolean;
  canReport: boolean;
  canBookmarkLocally: boolean;
}

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface AnnouncementAttachment {
  id: string;
  title: string;
  kind: "pdf" | "document" | "image";
  size: string;
}

export interface SchoolAnnouncement {
  id: string;
  schoolId: number;
  schoolName: string;
  schoolAcronym: string;
  title: string;
  excerpt: string;
  message: string[];
  publisher: string;
  publisherRole: "School administrator";
  publishedAt: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  isRead: boolean;
  attachments: AnnouncementAttachment[];
}

export type NotificationCategory =
  | "announcement"
  | "marks"
  | "attendance"
  | "assignment"
  | "profile"
  | "forum";

export interface TeacherNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  schoolId?: number;
  schoolName?: string;
  destination: string;
}

export interface UpdatesSnapshot {
  forumPosts: ForumPost[];
  announcements: SchoolAnnouncement[];
  notifications: TeacherNotification[];
}

