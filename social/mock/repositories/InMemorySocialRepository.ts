import {
  Comment,
  Conversation,
  CURRENT_TEACHER_ID,
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
import { socialSeed } from "@/social/mock/seeds";

const SESSION_DELAY_MS = 140;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, SESSION_DELAY_MS));
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export class InMemorySocialRepository implements SocialSessionRepository {
  private state: SocialSnapshot = clone(socialSeed);
  private listeners = new Set<() => void>();
  private sequence = 1000;
  private failureMode = false;

  getSnapshot = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setFailureMode = (enabled: boolean) => {
    this.failureMode = enabled;
  };

  updateCurrentTeacher = (identity: Partial<SocialTeacher>) => {
    const definedIdentity = Object.fromEntries(
      Object.entries(identity).filter(([, value]) => value !== undefined),
    ) as Partial<SocialTeacher>;
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((teacher) =>
        teacher.id === CURRENT_TEACHER_ID
          ? { ...teacher, ...definedIdentity }
          : teacher,
      ),
    };
    this.emit();
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private async simulate() {
    await delay();
    if (this.failureMode) {
      throw new Error("SOCIAL_MOCK_UNAVAILABLE");
    }
  }

  private id(prefix: string) {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  private teacher(id: string) {
    return this.state.teachers.find((teacher) => teacher.id === id);
  }

  private rankedPosts() {
    const current = this.teacher(CURRENT_TEACHER_ID);
    const followed = new Set(
      this.state.teachers
        .filter((teacher) => teacher.followedByCurrentUser)
        .map((teacher) => teacher.id),
    );
    const blocked = new Set(
      this.state.teachers.filter((teacher) => teacher.blocked).map((teacher) => teacher.id),
    );
    const interests = new Set((current?.subjects ?? []).map(normalize));
    const now = Date.now();

    return [...this.state.posts]
      .filter((post) => !blocked.has(post.authorId))
      .sort((a, b) => {
        const score = (post: SocialPost) => {
          const followedScore = followed.has(post.authorId) ? 10_000 : 0;
          const ownScore = post.authorId === CURRENT_TEACHER_ID ? 12_000 : 0;
          const matchScore =
            post.category && interests.has(normalize(post.category)) ? 2_000 : 0;
          const questionScore = post.type === "question" ? 300 : 0;
          const ageHours = Math.max(
            0,
            (now - new Date(post.createdAt).getTime()) / 3_600_000,
          );
          const recencyScore = Math.max(0, 1_200 - ageHours * 8);
          const popularity =
            post.reactions.total + post.commentCount * 2 + post.reshareCount * 3;
          return ownScore + followedScore + matchScore + questionScore + recencyScore + popularity;
        };
        const difference = score(b) - score(a);
        return difference || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
      });
  }

  async getFeed(cursor = "0", limit = 5): Promise<FeedPage> {
    await this.simulate();
    const start = Math.max(0, Number(cursor) || 0);
    const posts = this.rankedPosts();
    const items = posts.slice(start, start + limit);
    return {
      items,
      nextCursor: start + limit < posts.length ? String(start + limit) : undefined,
    };
  }

  refreshFeed() {
    return this.getFeed("0", 5);
  }

  async getPost(id: string) {
    await this.simulate();
    return this.state.posts.find((post) => post.id === id);
  }

  async createPost(draft: PostDraft) {
    await this.simulate();
    this.validateDraft(draft);
    const common = {
      id: this.id("post"),
      authorId: CURRENT_TEACHER_ID,
      createdAt: new Date().toISOString(),
      text: draft.text.trim(),
      images: [...draft.images],
      imageDescriptions: draft.imageDescriptions ?? draft.images.map(() => ""),
      category: draft.category,
      schoolAffiliation: draft.schoolAffiliation,
      location: draft.location,
      taggedTeacherIds: draft.taggedTeacherIds ?? [],
      hashtags: draft.hashtags ?? this.extractHashtags(draft.text),
      reactions: {
        total: 0,
        breakdown: { like: 0, love: 0, support: 0, insightful: 0, celebrate: 0 },
      },
      commentCount: 0,
      reshareCount: 0,
      saved: false,
      reported: false,
    };
    let post: SocialPost;
    if (draft.type === "poll") {
      if (!draft.poll) throw new Error("POLL_INCOMPLETE");
      post = {
        ...common,
        type: "poll",
        poll: {
          question: draft.poll.question.trim(),
          multiple: draft.poll.multiple,
          currentUserOptionIds: [],
          options: draft.poll.options
            .map((text) => text.trim())
            .filter(Boolean)
            .map((text) => ({ id: this.id("option"), text, votes: 0 })),
        },
      };
    } else if (draft.type === "question") {
      post = {
        ...common,
        type: "question",
        questionTitle: draft.questionTitle?.trim() ?? "",
      };
    } else {
      post = { ...common, type: draft.type as "text" | "image" };
    }
    this.state = { ...this.state, posts: [post, ...this.state.posts] };
    this.emit();
    return post;
  }

  async editPost(id: string, draft: PostDraft) {
    await this.simulate();
    this.validateDraft(draft);
    const existing = this.state.posts.find((post) => post.id === id);
    if (!existing) throw new Error("POST_NOT_FOUND");
    if (existing.authorId !== CURRENT_TEACHER_ID) throw new Error("NOT_AUTHORIZED");
    if (existing.type === "reshare" || existing.type === "quote") {
      throw new Error("RESHARE_EDIT_NOT_SUPPORTED");
    }
    if (existing.type !== draft.type) throw new Error("POST_TYPE_CANNOT_CHANGE");

    let updated: SocialPost;
    const common = {
      ...existing,
      text: draft.text.trim(),
      images: [...draft.images],
      imageDescriptions: draft.imageDescriptions ?? existing.imageDescriptions,
      category: draft.category,
      schoolAffiliation: draft.schoolAffiliation,
      location: draft.location,
      taggedTeacherIds: draft.taggedTeacherIds ?? [],
      hashtags: draft.hashtags ?? this.extractHashtags(draft.text),
      editedAt: new Date().toISOString(),
    };
    if (existing.type === "poll") {
      if (!draft.poll) throw new Error("POLL_INCOMPLETE");
      updated = {
        ...common,
        type: "poll",
        poll: {
          ...existing.poll,
          question: draft.poll.question.trim(),
          multiple: draft.poll.multiple,
          options: draft.poll.options.map((text, index) => ({
            id: existing.poll.options[index]?.id ?? this.id("option"),
            text: text.trim(),
            votes: existing.poll.options[index]?.votes ?? 0,
          })),
        },
      };
    } else if (existing.type === "question") {
      updated = {
        ...common,
        type: "question",
        questionTitle: draft.questionTitle?.trim() ?? existing.questionTitle,
      };
    } else {
      updated = { ...common, type: existing.type as "text" | "image" };
    }
    this.state = {
      ...this.state,
      posts: this.state.posts.map((post) => (post.id === id ? updated : post)),
    };
    this.emit();
    return updated;
  }

  async deletePost(id: string) {
    await this.simulate();
    const post = this.state.posts.find((candidate) => candidate.id === id);
    if (!post) return;
    if (post.authorId !== CURRENT_TEACHER_ID) throw new Error("NOT_AUTHORIZED");
    this.state = {
      ...this.state,
      posts: this.state.posts.filter((candidate) => candidate.id !== id),
      comments: this.state.comments.filter((comment) => comment.postId !== id),
    };
    this.emit();
  }

  async react(id: string, reaction?: ReactionType) {
    await this.simulate();
    this.state = {
      ...this.state,
      posts: this.state.posts.map((post) => {
        if (post.id !== id) return post;
        const breakdown = { ...post.reactions.breakdown };
        const previous = post.currentUserReaction;
        if (previous) breakdown[previous] = Math.max(0, breakdown[previous] - 1);
        const nextReaction = previous === reaction ? undefined : reaction;
        if (nextReaction) breakdown[nextReaction] += 1;
        return {
          ...post,
          currentUserReaction: nextReaction,
          reactions: {
            total: Object.values(breakdown).reduce((total, value) => total + value, 0),
            breakdown,
          },
        };
      }),
    };
    this.emit();
  }

  async savePost(id: string) {
    await this.simulate();
    this.state = {
      ...this.state,
      posts: this.state.posts.map((post) =>
        post.id === id ? { ...post, saved: !post.saved } : post,
      ),
    };
    this.emit();
  }

  async vote(id: string, optionIds: string[]) {
    await this.simulate();
    const post = this.state.posts.find((candidate) => candidate.id === id);
    if (!post || post.type !== "poll") throw new Error("POLL_NOT_FOUND");
    const valid = optionIds.filter((optionId) =>
      post.poll.options.some((option) => option.id === optionId),
    );
    if (!valid.length || (!post.poll.multiple && valid.length !== 1)) {
      throw new Error("INVALID_POLL_SELECTION");
    }
    const previous = new Set(post.poll.currentUserOptionIds);
    const next = new Set(valid);
    const updated: SocialPost = {
      ...post,
      poll: {
        ...post.poll,
        currentUserOptionIds: valid,
        options: post.poll.options.map((option) => ({
          ...option,
          votes:
            option.votes -
            (previous.has(option.id) ? 1 : 0) +
            (next.has(option.id) ? 1 : 0),
        })),
      },
    };
    this.state = {
      ...this.state,
      posts: this.state.posts.map((candidate) =>
        candidate.id === id ? updated : candidate,
      ),
    };
    this.emit();
  }

  async reshare(id: string, quoteText?: string) {
    await this.simulate();
    const original = this.state.posts.find((post) => post.id === id);
    if (!original) throw new Error("POST_NOT_FOUND");
    const post: SocialPost = {
      id: this.id("post"),
      authorId: CURRENT_TEACHER_ID,
      type: quoteText?.trim() ? "quote" : "reshare",
      originalPostId: id,
      quoteText: quoteText?.trim(),
      createdAt: new Date().toISOString(),
      text: quoteText?.trim() ?? "",
      images: [],
      imageDescriptions: [],
      category: original.category,
      schoolAffiliation: original.schoolAffiliation,
      location: original.location,
      taggedTeacherIds: [],
      hashtags: [],
      reactions: {
        total: 0,
        breakdown: { like: 0, love: 0, support: 0, insightful: 0, celebrate: 0 },
      },
      commentCount: 0,
      reshareCount: 0,
      saved: false,
      reported: false,
    };
    this.state = {
      ...this.state,
      posts: [
        post,
        ...this.state.posts.map((candidate) =>
          candidate.id === id
            ? { ...candidate, reshareCount: candidate.reshareCount + 1 }
            : candidate,
        ),
      ],
    };
    this.emit();
    return post;
  }

  async getComments(postId: string) {
    await this.simulate();
    return this.state.comments.filter((comment) => comment.postId === postId);
  }

  async addComment(postId: string, text: string, parentId?: string) {
    await this.simulate();
    if (!text.trim()) throw new Error("COMMENT_REQUIRED");
    if (!this.state.posts.some((post) => post.id === postId)) {
      throw new Error("POST_NOT_FOUND");
    }
    if (
      parentId &&
      !this.state.comments.some(
        (comment) => comment.id === parentId && comment.postId === postId && !comment.parentId,
      )
    ) {
      throw new Error("INVALID_REPLY_TARGET");
    }
    const comment: Comment = {
      id: this.id("comment"),
      postId,
      authorId: CURRENT_TEACHER_ID,
      parentId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      deleted: false,
    };
    this.state = {
      ...this.state,
      comments: [...this.state.comments, comment],
      posts: this.state.posts.map((post) =>
        post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post,
      ),
    };
    this.emit();
    return comment;
  }

  async deleteComment(id: string) {
    await this.simulate();
    const comment = this.state.comments.find((candidate) => candidate.id === id);
    if (!comment) return;
    if (comment.authorId !== CURRENT_TEACHER_ID) throw new Error("NOT_AUTHORIZED");
    const hasReplies = this.state.comments.some((candidate) => candidate.parentId === id);
    this.state = {
      ...this.state,
      comments: hasReplies
        ? this.state.comments.map((candidate) =>
            candidate.id === id ? { ...candidate, text: "", deleted: true } : candidate,
          )
        : this.state.comments.filter((candidate) => candidate.id !== id),
      posts: this.state.posts.map((post) =>
        post.id === comment.postId
          ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
          : post,
      ),
    };
    this.emit();
  }

  async getTeachers() {
    await this.simulate();
    return this.state.teachers.filter((teacher) => !teacher.blocked);
  }

  async follow(teacherId: string) {
    await this.simulate();
    if (teacherId === CURRENT_TEACHER_ID) throw new Error("CANNOT_FOLLOW_SELF");
    const target = this.teacher(teacherId);
    if (!target || target.blocked) throw new Error("TEACHER_UNAVAILABLE");
    const following = !target.followedByCurrentUser;
    const becameMutual = following && target.followsCurrentUser;
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((teacher) => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            followedByCurrentUser: following,
            followerCount: Math.max(0, teacher.followerCount + (following ? 1 : -1)),
          };
        }
        if (teacher.id === CURRENT_TEACHER_ID) {
          return {
            ...teacher,
            followingCount: Math.max(0, teacher.followingCount + (following ? 1 : -1)),
          };
        }
        return teacher;
      }),
      notifications: becameMutual
        ? [
            {
              id: this.id("notification"),
              category: "social",
              title: `You can now message ${target.name}`,
              body: "You follow each other.",
              createdAt: new Date().toISOString(),
              read: false,
              actorId: target.id,
              destination: `/social/profile/${target.id}`,
            },
            ...this.state.notifications,
          ]
        : this.state.notifications,
    };
    this.emit();
  }

  async block(teacherId: string) {
    await this.simulate();
    if (teacherId === CURRENT_TEACHER_ID) throw new Error("CANNOT_BLOCK_SELF");
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, blocked: true, followedByCurrentUser: false, followsCurrentUser: false }
          : teacher,
      ),
      conversations: this.state.conversations.filter(
        (conversation) => !conversation.participantIds.includes(teacherId),
      ),
    };
    this.emit();
  }

  async unblock(teacherId: string) {
    await this.simulate();
    this.state = {
      ...this.state,
      teachers: this.state.teachers.map((teacher) =>
        teacher.id === teacherId ? { ...teacher, blocked: false } : teacher,
      ),
    };
    this.emit();
  }

  async getConversations() {
    await this.simulate();
    return [...this.state.conversations].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async getEligibleTeachers() {
    await this.simulate();
    return this.state.teachers.filter(
      (teacher) =>
        teacher.id !== CURRENT_TEACHER_ID &&
        !teacher.blocked &&
        teacher.followedByCurrentUser &&
        teacher.followsCurrentUser,
    );
  }

  async startConversation(teacherId: string) {
    await this.simulate();
    const teacher = this.teacher(teacherId);
    if (
      !teacher ||
      teacher.blocked ||
      !teacher.followedByCurrentUser ||
      !teacher.followsCurrentUser
    ) {
      throw new Error("MUTUAL_FOLLOW_REQUIRED");
    }
    const existing = this.state.conversations.find(
      (conversation) =>
        conversation.participantIds.includes(CURRENT_TEACHER_ID) &&
        conversation.participantIds.includes(teacherId),
    );
    if (existing) return existing;
    const conversation: Conversation = {
      id: this.id("conversation"),
      participantIds: [CURRENT_TEACHER_ID, teacherId],
      messages: [],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      conversations: [conversation, ...this.state.conversations],
    };
    this.emit();
    return conversation;
  }

  async sendMessage(conversationId: string, text: string) {
    if (!text.trim()) throw new Error("MESSAGE_REQUIRED");
    return this.addMessage(conversationId, {
      id: this.id("message"),
      conversationId,
      senderId: CURRENT_TEACHER_ID,
      kind: "text",
      text: text.trim(),
      sentAt: new Date().toISOString(),
      status: "sent",
    });
  }

  async sendImage(conversationId: string, uri: string) {
    if (!uri) throw new Error("IMAGE_REQUIRED");
    return this.addMessage(conversationId, {
      id: this.id("message"),
      conversationId,
      senderId: CURRENT_TEACHER_ID,
      kind: "image",
      mediaUri: uri,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
  }

  async share(conversationId: string, input: SharedMessageInput) {
    return this.addMessage(conversationId, {
      id: this.id("message"),
      conversationId,
      senderId: CURRENT_TEACHER_ID,
      kind: input.kind,
      sharedId: input.sharedId,
      text: input.text?.trim(),
      sentAt: new Date().toISOString(),
      status: "sent",
    });
  }

  private async addMessage(conversationId: string, message: Message) {
    const conversation = this.state.conversations.find(
      (candidate) => candidate.id === conversationId,
    );
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
    const otherId = conversation.participantIds.find((id) => id !== CURRENT_TEACHER_ID);
    const other = otherId ? this.teacher(otherId) : undefined;
    if (
      !other ||
      other.blocked ||
      !other.followedByCurrentUser ||
      !other.followsCurrentUser
    ) {
      throw new Error("MUTUAL_FOLLOW_REQUIRED");
    }
    const optimisticMessage = { ...message, status: "sending" as const };
    this.state = {
      ...this.state,
      conversations: this.state.conversations.map((candidate) =>
        candidate.id === conversationId
          ? {
              ...candidate,
              messages: [...candidate.messages, optimisticMessage],
              updatedAt: message.sentAt,
            }
          : candidate,
      ),
    };
    this.emit();
    try {
      await this.simulate();
    } catch (error) {
      this.state = {
        ...this.state,
        conversations: this.state.conversations.map((candidate) =>
          candidate.id === conversationId
            ? {
                ...candidate,
                messages: candidate.messages.filter(
                  (candidateMessage) => candidateMessage.id !== message.id,
                ),
              }
            : candidate,
        ),
      };
      this.emit();
      throw error;
    }
    this.state = {
      ...this.state,
      conversations: this.state.conversations.map((candidate) =>
        candidate.id === conversationId
          ? {
              ...candidate,
              messages: candidate.messages.map((candidateMessage) =>
                candidateMessage.id === message.id
                  ? { ...candidateMessage, status: "sent" }
                  : candidateMessage,
              ),
            }
          : candidate,
      ),
    };
    this.emit();
    return message;
  }

  async markConversationRead(conversationId: string) {
    await this.simulate();
    this.state = {
      ...this.state,
      conversations: this.state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              unreadCount: 0,
              messages: conversation.messages.map((message) => ({
                ...message,
                status: "read",
              })),
            }
          : conversation,
      ),
    };
    this.emit();
  }

  async getJobs(filters: JobFilters = {}) {
    await this.simulate();
    const query = normalize(filters.query ?? "");
    return this.state.jobs.filter((job) => {
      const matchesQuery =
        !query ||
        normalize(
          `${job.title} ${job.schoolName} ${job.location} ${job.subjects.join(" ")}`,
        ).includes(query);
      return (
        matchesQuery &&
        (!filters.subject || job.subjects.includes(filters.subject)) &&
        (!filters.location || normalize(job.location).includes(normalize(filters.location))) &&
        (!filters.qualification ||
          normalize(job.qualification).includes(normalize(filters.qualification))) &&
        (!filters.level || job.level === filters.level) &&
        (!filters.employmentType || job.employmentType === filters.employmentType) &&
        (filters.experienceYears === undefined ||
          job.experienceYears <= filters.experienceYears) &&
        (!filters.savedOnly || job.saved)
      );
    });
  }

  async toggleSaved(jobId: string) {
    await this.simulate();
    this.state = {
      ...this.state,
      jobs: this.state.jobs.map((job) =>
        job.id === jobId ? { ...job, saved: !job.saved } : job,
      ),
    };
    this.emit();
  }

  async apply(jobId: string, motivation: string, availability: string) {
    await this.simulate();
    if (!motivation.trim() || !availability.trim()) throw new Error("APPLICATION_INCOMPLETE");
    if (
      this.state.applications.some(
        (application) =>
          application.jobId === jobId && application.teacherId === CURRENT_TEACHER_ID,
      )
    ) {
      throw new Error("ALREADY_APPLIED");
    }
    const timestamp = new Date().toISOString();
    const application: JobApplication = {
      id: this.id("application"),
      jobId,
      teacherId: CURRENT_TEACHER_ID,
      motivation: motivation.trim(),
      availability: availability.trim(),
      status: "submitted",
      submittedAt: timestamp,
      updatedAt: timestamp,
    };
    const job = this.state.jobs.find((candidate) => candidate.id === jobId);
    this.state = {
      ...this.state,
      applications: [application, ...this.state.applications],
      notifications: [
        {
          id: this.id("notification"),
          category: "jobs",
          title: "Application submitted",
          body: `Your application to ${job?.schoolName ?? "the school"} is ready for review.`,
          createdAt: timestamp,
          read: false,
          destination: "/social/applications",
        },
        ...this.state.notifications,
      ],
    };
    this.emit();
    return application;
  }

  async editApplication(
    applicationId: string,
    motivation: string,
    availability: string,
  ) {
    await this.simulate();
    const application = this.state.applications.find(
      (candidate) => candidate.id === applicationId,
    );
    if (!application) throw new Error("APPLICATION_NOT_FOUND");
    if (application.status !== "submitted") throw new Error("APPLICATION_READ_ONLY");
    if (!motivation.trim() || !availability.trim()) throw new Error("APPLICATION_INCOMPLETE");
    const updated = {
      ...application,
      motivation: motivation.trim(),
      availability: availability.trim(),
      updatedAt: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      applications: this.state.applications.map((candidate) =>
        candidate.id === applicationId ? updated : candidate,
      ),
    };
    this.emit();
    return updated;
  }

  async getNotifications(category?: NotificationCategory) {
    await this.simulate();
    return this.state.notifications
      .filter((notification) => !category || notification.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markRead(id: string) {
    await this.simulate();
    this.state = {
      ...this.state,
      notifications: this.state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    };
    this.emit();
  }

  async markCategoryRead(category: NotificationCategory) {
    await this.simulate();
    this.state = {
      ...this.state,
      notifications: this.state.notifications.map((notification) =>
        notification.category === category ? { ...notification, read: true } : notification,
      ),
    };
    this.emit();
  }

  async reportPost(postId: string, reason: string) {
    await this.simulate();
    const post = this.state.posts.find((candidate) => candidate.id === postId);
    if (!post) throw new Error("POST_NOT_FOUND");
    if (post.reported) throw new Error("ALREADY_REPORTED");
    this.state = {
      ...this.state,
      posts: this.state.posts.map((candidate) =>
        candidate.id === postId ? { ...candidate, reported: true } : candidate,
      ),
      reports: [
        ...this.state.reports,
        { postId, reason, createdAt: new Date().toISOString() },
      ],
    };
    this.emit();
  }

  async search(query: string): Promise<SearchResults> {
    await this.simulate();
    const term = normalize(query);
    if (!term) return { teachers: [], posts: [], jobs: [] };
    const teacherIds = new Set(
      this.state.teachers.filter((teacher) => teacher.blocked).map((teacher) => teacher.id),
    );
    return {
      teachers: this.state.teachers.filter(
        (teacher) =>
          !teacher.blocked &&
          teacher.id !== CURRENT_TEACHER_ID &&
          normalize(
            `${teacher.name} ${teacher.headline} ${teacher.city} ${teacher.subjects.join(" ")}`,
          ).includes(term),
      ),
      posts: this.state.posts.filter(
        (post) =>
          !teacherIds.has(post.authorId) &&
          normalize(
            `${post.text} ${post.category ?? ""} ${post.hashtags.join(" ")}`,
          ).includes(term),
      ),
      jobs: this.state.jobs.filter((job) =>
        normalize(
          `${job.title} ${job.schoolName} ${job.location} ${job.subjects.join(" ")}`,
        ).includes(term),
      ),
    };
  }

  private validateDraft(draft: PostDraft) {
    const hasText = Boolean(draft.text.trim());
    if (draft.type === "image" && !draft.images.length) throw new Error("IMAGE_REQUIRED");
    if (draft.type === "question" && !draft.questionTitle?.trim()) {
      throw new Error("QUESTION_REQUIRED");
    }
    if (draft.type === "poll") {
      const options = draft.poll?.options.map((option) => option.trim()).filter(Boolean) ?? [];
      if (!draft.poll?.question.trim() || options.length < 2) {
        throw new Error("POLL_INCOMPLETE");
      }
      if (new Set(options.map(normalize)).size !== options.length) {
        throw new Error("POLL_DUPLICATE_OPTIONS");
      }
    }
    if (!hasText && !draft.images.length && draft.type !== "poll" && draft.type !== "question") {
      throw new Error("POST_CONTENT_REQUIRED");
    }
  }

  private extractHashtags(text: string) {
    return Array.from(
      new Set(
        (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((tag) => tag.slice(1)),
      ),
    );
  }
}

export const socialRepository = new InMemorySocialRepository();
