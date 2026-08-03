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
import { SocialSessionRepository } from "@/social/repositories/contracts";
import { CommentsApiRepository } from "@/social/repositories/api/CommentsApiRepository";
import { JobsApiRepository } from "@/social/repositories/api/JobsApiRepository";
import { MessagingApiRepository } from "@/social/repositories/api/MessagingApiRepository";
import { NetworkApiRepository } from "@/social/repositories/api/NetworkApiRepository";
import { NotificationsApiRepository } from "@/social/repositories/api/NotificationsApiRepository";
import { PostsApiRepository } from "@/social/repositories/api/PostsApiRepository";
import { SearchApiRepository } from "@/social/repositories/api/SearchApiRepository";
import { UnreadCountsDto } from "@/social/api/dto";
import { clearMediaRegistry } from "@/social/api/mediaRegistry";
import { setCurrentTeacherId } from "@/social/api/identity";
import { socialStore } from "@/social/store/socialStore";

/**
 * The single binding every social screen consumes, backed by the real API.
 *
 * Composes the per-area repositories and satisfies `SocialSessionRepository`
 * unchanged, so `social/services/repositories.ts` swaps one implementation for
 * another and no screen has to move.
 *
 * `getSnapshot` and `subscribe` are delegated to `socialStore`, which the
 * repositories fill from server responses. That is what lets the fourteen screens
 * that read `snapshot.*` keep working now the data is remote.
 */
export class ApiSocialRepository implements SocialSessionRepository {
  private readonly posts = new PostsApiRepository();

  private readonly comments = new CommentsApiRepository();

  private readonly network = new NetworkApiRepository();

  private readonly messaging = new MessagingApiRepository();

  private readonly jobs = new JobsApiRepository();

  private readonly notifications = new NotificationsApiRepository();

  private readonly searchApi = new SearchApiRepository();

  /** Resolves once the session identity is known; see `identity.ts`. */
  private identity: Promise<SocialTeacher> | null = null;

  // ------------------------------------------------------------ session plumbing

  getSnapshot = (): SocialSnapshot => socialStore.getSnapshot();

  subscribe = (listener: () => void): (() => void) => socialStore.subscribe(listener);

  /**
   * Loads the signed-in teacher's profile and registers their real id behind the
   * `CURRENT_TEACHER_ID` sentinel. Every other call awaits this, so ids translate
   * correctly no matter which screen opens first.
   */
  ensureIdentity(): Promise<SocialTeacher> {
    if (!this.identity) {
      this.identity = this.network.refreshOwnProfile().catch((cause) => {
        // Allow a retry on the next call rather than caching the failure forever.
        this.identity = null;
        throw cause;
      });
    }

    return this.identity;
  }

  /** Clears cached session state. Called on sign-out. */
  reset(): void {
    this.identity = null;
    setCurrentTeacherId(null);
    clearMediaRegistry();
    socialStore.reset();
  }

  /**
   * Kept for interface compatibility with phase 1.
   *
   * The professional profile is now server-owned, so overlaying locally cached
   * identity fields would fight the API. `SocialProvider` calls this on login to
   * trigger the profile load instead of writing fields into a mock.
   */
  updateCurrentTeacher(_identity: Partial<SocialTeacher>): void {
    void this.ensureIdentity().catch(() => undefined);
  }

  // ------------------------------------------------------------------------ feed

  async getFeed(cursor?: string, limit?: number): Promise<FeedPage> {
    await this.ensureIdentity();
    return this.posts.getFeed(cursor, limit);
  }

  async refreshFeed(): Promise<FeedPage> {
    await this.ensureIdentity();
    return this.posts.refreshFeed();
  }

  // ----------------------------------------------------------------------- posts

  async getPost(id: string): Promise<SocialPost | undefined> {
    await this.ensureIdentity();
    return this.posts.getPost(id);
  }

  async createPost(draft: PostDraft): Promise<SocialPost> {
    await this.ensureIdentity();
    return this.posts.createPost(draft);
  }

  async editPost(id: string, draft: PostDraft): Promise<SocialPost> {
    await this.ensureIdentity();
    return this.posts.editPost(id, draft);
  }

  deletePost(id: string): Promise<void> {
    return this.posts.deletePost(id);
  }

  react(id: string, reaction?: ReactionType): Promise<void> {
    return this.posts.react(id, reaction);
  }

  savePost(id: string): Promise<void> {
    return this.posts.savePost(id);
  }

  vote(id: string, optionIds: string[]): Promise<void> {
    return this.posts.vote(id, optionIds);
  }

  reshare(id: string, quoteText?: string): Promise<SocialPost> {
    return this.posts.reshare(id, quoteText);
  }

  async getSavedPosts(): Promise<SocialPost[]> {
    await this.ensureIdentity();
    return this.posts.getSavedPosts();
  }

  async getTeacherPosts(teacherId: string, kind?: "posts" | "reshares"): Promise<SocialPost[]> {
    await this.ensureIdentity();
    return this.posts.getTeacherPosts(teacherId, kind);
  }

  // -------------------------------------------------------------------- comments

  async getComments(postId: string): Promise<Comment[]> {
    await this.ensureIdentity();
    return this.comments.getComments(postId);
  }

  addComment(postId: string, text: string, parentId?: string): Promise<Comment> {
    return this.comments.addComment(postId, text, parentId);
  }

  deleteComment(id: string): Promise<void> {
    return this.comments.deleteComment(id);
  }

  loadReplies(commentId: string, cursor?: string) {
    return this.comments.loadReplies(commentId, cursor);
  }

  // --------------------------------------------------------------------- network

  async getTeachers(): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getTeachers();
  }

  follow(teacherId: string): Promise<void> {
    return this.network.follow(teacherId);
  }

  block(teacherId: string): Promise<void> {
    return this.network.block(teacherId);
  }

  unblock(teacherId: string): Promise<void> {
    return this.network.unblock(teacherId);
  }

  async getSuggestedTeachers(): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getSuggestedTeachers();
  }

  async getTrendingTeachers(): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getTrendingTeachers();
  }

  async getBlockedTeachers(): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getBlockedTeachers();
  }

  async getFollowers(teacherId: string): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getFollowers(teacherId);
  }

  async getFollowing(teacherId: string): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.network.getFollowing(teacherId);
  }

  async getTeacher(teacherId: string): Promise<SocialTeacher | undefined> {
    await this.ensureIdentity();
    return this.network.getTeacher(teacherId);
  }

  updateOwnProfile(changes: Partial<SocialTeacher>): Promise<SocialTeacher> {
    return this.network.updateOwnProfile(changes);
  }

  // ------------------------------------------------------------------- messaging

  async getConversations(query?: string): Promise<Conversation[]> {
    await this.ensureIdentity();
    return this.messaging.getConversations(query);
  }

  async getEligibleTeachers(): Promise<SocialTeacher[]> {
    await this.ensureIdentity();
    return this.messaging.getEligibleTeachers();
  }

  startConversation(teacherId: string): Promise<Conversation> {
    return this.messaging.startConversation(teacherId);
  }

  getMessages(conversationId: string, cursor?: string) {
    return this.messaging.getMessages(conversationId, cursor);
  }

  sendMessage(
    conversationId: string,
    text: string,
    options?: { replyToId?: string; forwarded?: boolean },
  ): Promise<Message> {
    return this.messaging.sendMessage(conversationId, text, options);
  }

  editMessage(conversationId: string, messageId: string, text: string): Promise<Message> {
    return this.messaging.editMessage(conversationId, messageId, text);
  }

  deleteMessage(conversationId: string, messageId: string): Promise<Message> {
    return this.messaging.deleteMessage(conversationId, messageId);
  }

  deleteConversation(conversationId: string): Promise<void> {
    return this.messaging.deleteConversation(conversationId);
  }

  sendImage(
    conversationId: string,
    uri: string,
    onProgress?: (fraction: number) => void,
  ): Promise<Message> {
    return this.messaging.sendImage(conversationId, uri, onProgress);
  }

  share(conversationId: string, input: SharedMessageInput): Promise<Message> {
    return this.messaging.share(conversationId, input);
  }

  markConversationRead(conversationId: string): Promise<void> {
    return this.messaging.markConversationRead(conversationId);
  }

  canSend(conversationId: string): boolean {
    return this.messaging.canSend(conversationId);
  }

  // ------------------------------------------------------------------------ jobs

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    await this.ensureIdentity();
    return this.jobs.getJobs(filters);
  }

  async getJob(id: string): Promise<Job | undefined> {
    await this.ensureIdentity();
    return this.jobs.getJob(id);
  }

  toggleSaved(jobId: string): Promise<void> {
    return this.jobs.toggleSaved(jobId);
  }

  apply(jobId: string, motivation: string, availability: string): Promise<JobApplication> {
    return this.jobs.apply(jobId, motivation, availability);
  }

  editApplication(
    applicationId: string,
    motivation: string,
    availability: string,
  ): Promise<JobApplication> {
    return this.jobs.editApplication(applicationId, motivation, availability);
  }

  async getApplications(status?: JobApplication["status"]): Promise<JobApplication[]> {
    await this.ensureIdentity();
    return this.jobs.getApplications(status);
  }

  // --------------------------------------------------------------- notifications

  async getNotifications(category?: NotificationCategory): Promise<SocialNotification[]> {
    await this.ensureIdentity();
    return this.notifications.getNotifications(category);
  }

  async getAllNotifications(): Promise<SocialNotification[]> {
    await this.ensureIdentity();
    return this.notifications.getAllCategories();
  }

  markRead(id: string): Promise<void> {
    return this.notifications.markRead(id);
  }

  markCategoryRead(category: NotificationCategory): Promise<void> {
    return this.notifications.markCategoryRead(category);
  }

  getUnreadCounts(): Promise<UnreadCountsDto> {
    return this.notifications.getUnreadCounts();
  }

  // ------------------------------------------------------------------ moderation

  reportPost(postId: string, reason: string): Promise<void> {
    return this.network.reportPost(postId, reason);
  }

  // ---------------------------------------------------------------------- search

  async search(query: string): Promise<SearchResults> {
    await this.ensureIdentity();
    return this.searchApi.search(query);
  }
}
