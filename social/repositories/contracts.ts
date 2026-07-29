import {
  Comment,
  Conversation,
  FeedPage,
  Job,
  JobApplication,
  JobFilters,
  Message,
  NotificationCategory,
  PostDraft,
  ReactionType,
  SearchResults,
  SharedMessageInput,
  SocialNotification,
  SocialPost,
  SocialSnapshot,
  SocialTeacher,
} from "@/social/models";

export interface SocialFeedRepository {
  getFeed(cursor?: string, limit?: number): Promise<FeedPage>;
  refreshFeed(): Promise<FeedPage>;
}

export interface PostsRepository {
  getPost(id: string): Promise<SocialPost | undefined>;
  createPost(draft: PostDraft): Promise<SocialPost>;
  editPost(id: string, draft: PostDraft): Promise<SocialPost>;
  deletePost(id: string): Promise<void>;
  react(id: string, reaction?: ReactionType): Promise<void>;
  savePost(id: string): Promise<void>;
  vote(id: string, optionIds: string[]): Promise<void>;
  reshare(id: string, quoteText?: string): Promise<SocialPost>;
}

export interface CommentsRepository {
  getComments(postId: string): Promise<Comment[]>;
  addComment(postId: string, text: string, parentId?: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
}

export interface NetworkRepository {
  getTeachers(): Promise<SocialTeacher[]>;
  follow(teacherId: string): Promise<void>;
  block(teacherId: string): Promise<void>;
  unblock(teacherId: string): Promise<void>;
}

export interface MessagingRepository {
  getConversations(): Promise<Conversation[]>;
  getEligibleTeachers(): Promise<SocialTeacher[]>;
  startConversation(teacherId: string): Promise<Conversation>;
  sendMessage(conversationId: string, text: string): Promise<Message>;
  sendImage(conversationId: string, uri: string): Promise<Message>;
  share(conversationId: string, input: SharedMessageInput): Promise<Message>;
  markConversationRead(conversationId: string): Promise<void>;
}

export interface JobsRepository {
  getJobs(filters?: JobFilters): Promise<Job[]>;
  toggleSaved(jobId: string): Promise<void>;
  apply(jobId: string, motivation: string, availability: string): Promise<JobApplication>;
  editApplication(applicationId: string, motivation: string, availability: string): Promise<JobApplication>;
}

export interface NotificationsRepository {
  getNotifications(category?: NotificationCategory): Promise<SocialNotification[]>;
  markRead(id: string): Promise<void>;
  markCategoryRead(category: NotificationCategory): Promise<void>;
}

export interface ModerationRepository {
  reportPost(postId: string, reason: string): Promise<void>;
}

export interface SearchRepository {
  search(query: string): Promise<SearchResults>;
}

export interface SocialSessionRepository
  extends SocialFeedRepository,
    PostsRepository,
    CommentsRepository,
    NetworkRepository,
    MessagingRepository,
    JobsRepository,
    NotificationsRepository,
    ModerationRepository,
    SearchRepository {
  getSnapshot(): SocialSnapshot;
  subscribe(listener: () => void): () => void;
  updateCurrentTeacher(identity: Partial<SocialTeacher>): void;
  setFailureMode(enabled: boolean): void;
}
