export const CURRENT_TEACHER_ID = "teacher-current";

export type ReactionType = "like" | "love" | "support" | "insightful" | "celebrate";
export type PostType = "text" | "image" | "poll" | "question" | "reshare" | "quote";
export type NotificationCategory = "social" | "jobs" | "school";
export type ApplicationStatus = "submitted" | "viewed" | "accepted" | "rejected";
export type EmploymentType = "full-time" | "part-time" | "contract" | "temporary";
export type MessageKind = "text" | "image" | "post" | "job" | "profile";

export interface SocialTeacher {
  id: string;
  name: string;
  headline: string;
  biography: string;
  photoUrl?: string;
  city: string;
  subjects: string[];
  levels: string[];
  qualifications: string[];
  certifications: string[];
  skills: string[];
  languages: string[];
  yearsExperience: number;
  schoolNames: string[];
  verified: boolean;
  profileCompletion: number;
  followerCount: number;
  followingCount: number;
  postCount: number;
  engagementScore: number;
  followedByCurrentUser: boolean;
  followsCurrentUser: boolean;
  blocked: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  multiple: boolean;
  options: PollOption[];
  currentUserOptionIds: string[];
}

export interface ReactionSummary {
  total: number;
  breakdown: Record<ReactionType, number>;
}

interface PostBase {
  id: string;
  authorId: string;
  createdAt: string;
  editedAt?: string;
  text: string;
  images: string[];
  imageDescriptions: string[];
  category?: string;
  schoolAffiliation?: string;
  location?: string;
  taggedTeacherIds: string[];
  hashtags: string[];
  reactions: ReactionSummary;
  currentUserReaction?: ReactionType;
  commentCount: number;
  reshareCount: number;
  saved: boolean;
  reported: boolean;
  recommendedReason?: string;
}

export interface StandardPost extends PostBase {
  type: "text" | "image";
}

export interface PollPost extends PostBase {
  type: "poll";
  poll: PollData;
}

export interface QuestionPost extends PostBase {
  type: "question";
  questionTitle: string;
}

export interface ResharePost extends PostBase {
  type: "reshare" | "quote";
  originalPostId: string;
  quoteText?: string;
}

export type SocialPost = StandardPost | PollPost | QuestionPost | ResharePost;

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  text: string;
  createdAt: string;
  deleted: boolean;
}

export interface PostDraft {
  type: "text" | "image" | "poll" | "question";
  text: string;
  images: string[];
  imageDescriptions?: string[];
  category?: string;
  schoolAffiliation?: string;
  location?: string;
  taggedTeacherIds?: string[];
  hashtags?: string[];
  questionTitle?: string;
  poll?: {
    question: string;
    multiple: boolean;
    options: string[];
  };
}

export interface Job {
  id: string;
  title: string;
  schoolName: string;
  schoolLogoUrl?: string;
  schoolSummary: string;
  location: string;
  subjects: string[];
  qualification: string;
  level: string;
  experienceYears: number;
  employmentType: EmploymentType;
  description: string;
  responsibilities: string[];
  publishedAt: string;
  deadline: string;
  positions?: number;
  saved: boolean;
  recommended: boolean;
}

export interface JobFilters {
  query?: string;
  subject?: string;
  location?: string;
  qualification?: string;
  level?: string;
  employmentType?: EmploymentType;
  experienceYears?: number;
  savedOnly?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  teacherId: string;
  motivation: string;
  availability: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
}

export interface SocialNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  actorId?: string;
  destination: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  text?: string;
  mediaUri?: string;
  sharedId?: string;
  sentAt: string;
  status: "sending" | "sent" | "read";
  /** Tombstone: the row is kept but its content was withheld. */
  deleted?: boolean;
  editedAt?: string;
  forwarded?: boolean;
  replyToId?: string;
  /** Enough of the answered message to render a preview inline. */
  replyPreview?: {
    id: string;
    senderId: string;
    kind: MessageKind;
    text?: string;
    deleted: boolean;
  };
  /** Server-evaluated, so the edit window is judged by its clock not ours. */
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  messages: Message[];
  unreadCount: number;
  updatedAt: string;
}

export interface SocialSnapshot {
  teachers: SocialTeacher[];
  posts: SocialPost[];
  comments: Comment[];
  jobs: Job[];
  applications: JobApplication[];
  notifications: SocialNotification[];
  conversations: Conversation[];
  reports: Array<{ postId: string; reason: string; createdAt: string }>;
}

export interface SearchResults {
  teachers: SocialTeacher[];
  posts: SocialPost[];
  jobs: Job[];
}

export interface FeedPage {
  items: SocialPost[];
  nextCursor?: string;
}

export interface SharedMessageInput {
  kind: Exclude<MessageKind, "text" | "image">;
  sharedId: string;
  text?: string;
}
