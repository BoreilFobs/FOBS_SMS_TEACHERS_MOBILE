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
  /** `onProgress` reports 0..1 across image uploads, for the publish banner. */
  createPost(draft: PostDraft, onProgress?: (fraction: number) => void): Promise<SocialPost>;
  editPost(
    id: string,
    draft: PostDraft,
    onProgress?: (fraction: number) => void,
  ): Promise<SocialPost>;
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
  sendMessage(
    conversationId: string,
    text: string,
    options?: { replyToId?: string; forwarded?: boolean },
  ): Promise<Message>;
  /** Corrects the text of a message, allowed for a short window after sending. */
  editMessage(conversationId: string, messageId: string, text: string): Promise<Message>;
  /** Leaves a tombstone in place of the message. */
  deleteMessage(conversationId: string, messageId: string): Promise<Message>;
  /** Clears the conversation for the current teacher only. */
  deleteConversation(conversationId: string): Promise<void>;
  /** `onProgress` reports 0..1 while the image uploads, for the chat bubble. */
  sendImage(
    conversationId: string,
    uri: string,
    onProgress?: (fraction: number) => void,
  ): Promise<Message>;
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

/**
 * The binding every social screen consumes.
 *
 * The eight feature interfaces above are unchanged from the mock phase — the API
 * implementation satisfies them exactly.
 *
 * `getSnapshot`/`subscribe` are retained because fourteen screens read the
 * snapshot through `useSyncExternalStore`. They are now served by an
 * API-populated cache (`social/store/socialStore.ts`) rather than by mock state.
 *
 * INTERFACE CHANGE (the only one in this migration): `setFailureMode` has been
 * removed. It existed solely to make the mock throw on demand, and had no call
 * sites outside the mock itself. Real failures now come from the network.
 */
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
}
