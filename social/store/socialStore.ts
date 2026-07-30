import {
  Comment,
  Conversation,
  Job,
  JobApplication,
  Message,
  SocialNotification,
  SocialPost,
  SocialSnapshot,
  SocialTeacher,
} from "@/social/models";
import { mergeMessages } from "@/social/api/mappers";

/**
 * Observable cache of everything the professional-network screens read.
 *
 * WHY THIS EXISTS
 * ---------------
 * Phase 1's `useSocial()` exposes a synchronous `getSnapshot(): SocialSnapshot`
 * through `useSyncExternalStore`, and fourteen screens plus two components read
 * `snapshot.posts` / `.teachers` / `.comments` / `.conversations` /
 * `.notifications` / `.jobs` / `.applications` directly. The mock repository was
 * simultaneously the data source and the store.
 *
 * A network-backed repository cannot answer synchronously, so this store takes
 * over the store half of that job: repositories fetch, then write results here,
 * and `getSnapshot`/`subscribe` behave exactly as before. That keeps all fourteen
 * screens and both hooks unchanged, which is the point.
 *
 * It is a cache, not a source of truth — every entry arrives from the server and
 * server responses always overwrite local copies. Nothing is persisted, so a
 * restart refetches rather than resurrecting stale content.
 */

const emptySnapshot: SocialSnapshot = {
  teachers: [],
  posts: [],
  comments: [],
  jobs: [],
  applications: [],
  notifications: [],
  conversations: [],
  reports: [],
};

type Listener = () => void;

function upsertBy<T>(current: T[], incoming: T[], key: (item: T) => string): T[] {
  if (incoming.length === 0) return current;

  const index = new Map(current.map((item) => [key(item), item]));
  incoming.forEach((item) => index.set(key(item), item));

  return Array.from(index.values());
}

class SocialStore {
  private state: SocialSnapshot = emptySnapshot;

  private listeners = new Set<Listener>();

  /** Stable identity so `useSyncExternalStore` does not resubscribe each render. */
  getSnapshot = (): SocialSnapshot => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private patch(next: Partial<SocialSnapshot>): void {
    this.state = { ...this.state, ...next };
    this.emit();
  }

  /** Wipes the cache — used on sign-out so a new session starts clean. */
  reset(): void {
    this.state = emptySnapshot;
    this.emit();
  }

  // ---------------------------------------------------------------- teachers

  upsertTeachers(teachers: SocialTeacher[]): void {
    if (teachers.length === 0) return;
    this.patch({
      teachers: upsertBy(this.state.teachers, teachers, (teacher) => teacher.id),
    });
  }

  /**
   * Applies a follow/block state change to the cached copy so every screen
   * showing that teacher updates at once. Counters come from the server response
   * rather than being incremented locally.
   */
  patchTeacher(id: string, changes: Partial<SocialTeacher>): void {
    const exists = this.state.teachers.some((teacher) => teacher.id === id);
    if (!exists) return;

    this.patch({
      teachers: this.state.teachers.map((teacher) =>
        teacher.id === id ? { ...teacher, ...changes } : teacher,
      ),
    });
  }

  removeTeacher(id: string): void {
    this.patch({
      teachers: this.state.teachers.filter((teacher) => teacher.id !== id),
    });
  }

  // ------------------------------------------------------------------- posts

  upsertPosts(posts: SocialPost[]): void {
    if (posts.length === 0) return;
    this.patch({ posts: upsertBy(this.state.posts, posts, (post) => post.id) });
  }

  patchPost(id: string, changes: Partial<SocialPost>): void {
    this.patch({
      posts: this.state.posts.map((post) =>
        post.id === id ? ({ ...post, ...changes } as SocialPost) : post,
      ),
    });
  }

  removePost(id: string): void {
    this.patch({
      posts: this.state.posts.filter((post) => post.id !== id),
      comments: this.state.comments.filter((comment) => comment.postId !== id),
    });
  }

  /** Drops every post by an author, for when a block hides their content. */
  removePostsByAuthor(authorId: string): void {
    this.patch({
      posts: this.state.posts.filter((post) => post.authorId !== authorId),
    });
  }

  findPost(id: string): SocialPost | undefined {
    return this.state.posts.find((post) => post.id === id);
  }

  // ---------------------------------------------------------------- comments

  /** Replaces the cached thread for one post; server order is authoritative. */
  replaceCommentsForPost(postId: string, comments: Comment[]): void {
    this.patch({
      comments: [
        ...this.state.comments.filter((comment) => comment.postId !== postId),
        ...comments,
      ],
    });
  }

  upsertComments(comments: Comment[]): void {
    if (comments.length === 0) return;
    this.patch({
      comments: upsertBy(this.state.comments, comments, (comment) => comment.id),
    });
  }

  removeComment(id: string): void {
    this.patch({
      comments: this.state.comments.filter((comment) => comment.id !== id),
    });
  }

  // -------------------------------------------------------------------- jobs

  upsertJobs(jobs: Job[]): void {
    if (jobs.length === 0) return;
    this.patch({ jobs: upsertBy(this.state.jobs, jobs, (job) => job.id) });
  }

  patchJob(id: string, changes: Partial<Job>): void {
    this.patch({
      jobs: this.state.jobs.map((job) => (job.id === id ? { ...job, ...changes } : job)),
    });
  }

  upsertApplications(applications: JobApplication[]): void {
    if (applications.length === 0) return;
    this.patch({
      applications: upsertBy(
        this.state.applications,
        applications,
        (application) => application.id,
      ),
    });
  }

  // ----------------------------------------------------------- conversations

  upsertConversations(conversations: Conversation[]): void {
    if (conversations.length === 0) return;

    // Preserve any thread already loaded for a conversation the list refreshes.
    const merged = conversations.map((conversation) => {
      const existing = this.state.conversations.find(
        (candidate) => candidate.id === conversation.id,
      );

      return existing
        ? { ...conversation, messages: mergeMessages(existing.messages, conversation.messages) }
        : conversation;
    });

    this.patch({
      conversations: upsertBy(
        this.state.conversations,
        merged,
        (conversation) => conversation.id,
      ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    });
  }

  setConversationMessages(conversationId: string, messages: Message[]): void {
    this.patch({
      conversations: this.state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: mergeMessages(conversation.messages, messages) }
          : conversation,
      ),
    });
  }

  patchConversation(id: string, changes: Partial<Conversation>): void {
    this.patch({
      conversations: this.state.conversations.map((conversation) =>
        conversation.id === id ? { ...conversation, ...changes } : conversation,
      ),
    });
  }

  removeConversationsWith(teacherId: string): void {
    this.patch({
      conversations: this.state.conversations.filter(
        (conversation) => !conversation.participantIds.includes(teacherId),
      ),
    });
  }

  /**
   * Adds an optimistic message so the composer clears immediately, and returns a
   * rollback. The message is marked `sending` until the server confirms it.
   */
  addOptimisticMessage(conversationId: string, message: Message): () => void {
    this.setConversationMessages(conversationId, [message]);

    return () => {
      this.patch({
        conversations: this.state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.filter(
                  (candidate) => candidate.id !== message.id,
                ),
              }
            : conversation,
        ),
      });
    };
  }

  /** Swaps an optimistic placeholder for the server's authoritative message. */
  confirmMessage(conversationId: string, temporaryId: string, confirmed: Message): void {
    this.patch({
      conversations: this.state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const withoutPlaceholder = conversation.messages.filter(
          (candidate) => candidate.id !== temporaryId,
        );

        return {
          ...conversation,
          messages: mergeMessages(withoutPlaceholder, [confirmed]),
          updatedAt: confirmed.sentAt,
        };
      }),
    });
  }

  // ----------------------------------------------------------- notifications

  /** Replaces one category, leaving the other two intact. */
  replaceNotificationCategory(
    category: SocialNotification["category"],
    notifications: SocialNotification[],
  ): void {
    this.patch({
      notifications: [
        ...this.state.notifications.filter((item) => item.category !== category),
        ...notifications,
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  }

  upsertNotifications(notifications: SocialNotification[]): void {
    if (notifications.length === 0) return;
    this.patch({
      notifications: upsertBy(
        this.state.notifications,
        notifications,
        (notification) => notification.id,
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  }

  markNotificationRead(id: string): void {
    this.patch({
      notifications: this.state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    });
  }

  markCategoryRead(category: SocialNotification["category"]): void {
    this.patch({
      notifications: this.state.notifications.map((notification) =>
        notification.category === category ? { ...notification, read: true } : notification,
      ),
    });
  }

  // ----------------------------------------------------------------- reports

  addReport(postId: string, reason: string): void {
    this.patch({
      reports: [...this.state.reports, { postId, reason, createdAt: new Date().toISOString() }],
    });
  }
}

export const socialStore = new SocialStore();
export type { SocialStore };
