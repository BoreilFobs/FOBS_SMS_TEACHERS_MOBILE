import {
  Comment,
  Conversation,
  Job,
  JobApplication,
  Message,
  MessageKind,
  NotificationCategory,
  PollData,
  ReactionSummary,
  ReactionType,
  SocialNotification,
  SocialPost,
  SocialTeacher,
} from "@/social/models";
import {
  CommentDto,
  ConversationDto,
  JobApplicationDto,
  JobDto,
  MessageDto,
  NotificationDto,
  PollDto,
  PostDto,
  ReactionSummaryDto,
  TeacherDto,
} from "@/social/api/dto";
import { toLocalId } from "@/social/api/identity";
import { rememberMediaUrl } from "@/social/api/mediaRegistry";

/**
 * Wire → domain translation.
 *
 * The domain models in `social/models` are unchanged from phase 1, so every
 * screen and component keeps working. All adaptation between the backend's
 * snake_case resources and those models happens here and nowhere else.
 */

const REACTION_TYPES: ReactionType[] = [
  "like",
  "love",
  "support",
  "insightful",
  "celebrate",
];

const emptyBreakdown = (): Record<ReactionType, number> => ({
  like: 0,
  love: 0,
  support: 0,
  insightful: 0,
  celebrate: 0,
});

export function mapReactionSummary(dto: ReactionSummaryDto | undefined): ReactionSummary {
  const breakdown = emptyBreakdown();

  REACTION_TYPES.forEach((type) => {
    breakdown[type] = Number(dto?.breakdown?.[type] ?? 0);
  });

  return {
    total: Number(dto?.total ?? 0),
    breakdown,
  };
}

function asReactionType(value: string | null | undefined): ReactionType | undefined {
  return value && (REACTION_TYPES as string[]).includes(value)
    ? (value as ReactionType)
    : undefined;
}

export function mapTeacher(dto: TeacherDto): SocialTeacher {
  return {
    id: toLocalId(dto.id),
    name: dto.name ?? "",
    headline: dto.headline ?? "",
    biography: dto.biography ?? "",
    photoUrl: dto.photo_url ?? undefined,
    city: dto.city ?? "",
    subjects: dto.subjects ?? [],
    levels: dto.levels ?? [],
    qualifications: dto.qualifications ?? [],
    certifications: dto.certifications ?? [],
    skills: dto.skills ?? [],
    languages: dto.languages ?? [],
    yearsExperience: Number(dto.years_experience ?? 0),
    schoolNames: dto.school_names ?? [],
    verified: Boolean(dto.verified),
    profileCompletion: Number(dto.profile_completion ?? 0),
    followerCount: Number(dto.follower_count ?? 0),
    followingCount: Number(dto.following_count ?? 0),
    postCount: Number(dto.post_count ?? 0),
    engagementScore: Number(dto.engagement_score ?? 0),
    followedByCurrentUser: Boolean(dto.followed_by_current_user),
    followsCurrentUser: Boolean(dto.follows_current_user),
    blocked: Boolean(dto.blocked),
  };
}

function mapPoll(dto: PollDto): PollData {
  return {
    question: dto.question ?? "",
    multiple: Boolean(dto.multiple),
    currentUserOptionIds: (dto.current_user_option_ids ?? []).map(String),
    options: (dto.options ?? []).map((option) => ({
      id: String(option.id),
      text: option.text ?? "",
      votes: Number(option.votes ?? 0),
    })),
  };
}

export function mapPost(dto: PostDto): SocialPost {
  // Keep the id behind each image URL so an edit that retains an existing image
  // can send its media id back instead of re-uploading it.
  (dto.images ?? []).forEach((image) => rememberMediaUrl(image.url, image.id));

  const base = {
    id: String(dto.id),
    authorId: toLocalId(dto.author_id),
    createdAt: dto.created_at ?? new Date().toISOString(),
    editedAt: dto.edited_at ?? undefined,
    text: dto.text ?? "",
    // The domain model carries plain URLs; the backend returns media records.
    images: (dto.images ?? []).map((image) => image.url),
    imageDescriptions: (dto.images ?? []).map((image) => image.alt_text ?? ""),
    category: dto.category ?? undefined,
    schoolAffiliation: dto.school?.name ?? undefined,
    location: dto.location ?? undefined,
    taggedTeacherIds: (dto.tagged_teachers ?? []).map((teacher) => toLocalId(teacher.id)),
    hashtags: dto.hashtags ?? [],
    reactions: mapReactionSummary(dto.reactions),
    currentUserReaction: asReactionType(dto.current_user_reaction),
    commentCount: Number(dto.comment_count ?? 0),
    reshareCount: Number(dto.reshare_count ?? 0),
    saved: Boolean(dto.saved),
    reported: Boolean(dto.reported),
    recommendedReason: dto.recommendation_reason ?? undefined,
  };

  if (dto.type === "poll" && dto.poll) {
    return { ...base, type: "poll", poll: mapPoll(dto.poll) };
  }

  if (dto.type === "question") {
    return { ...base, type: "question", questionTitle: dto.question_title ?? "" };
  }

  if (dto.type === "reshare" || dto.type === "quote") {
    return {
      ...base,
      type: dto.type,
      originalPostId: dto.original_post_id ? String(dto.original_post_id) : "",
      quoteText: dto.quote_text ?? undefined,
    };
  }

  return { ...base, type: dto.type === "image" ? "image" : "text" };
}

/**
 * Every teacher summary embedded anywhere in a post payload, so the store's
 * `teachers` collection can be populated from a feed page without extra
 * requests. Phase 1 screens look authors up by id in that collection.
 */
export function collectTeachersFromPost(dto: PostDto): TeacherDto[] {
  const found: TeacherDto[] = [];

  if (dto.author) found.push(dto.author);

  if (dto.original_post && dto.original_post.available) {
    found.push(...collectTeachersFromPost(dto.original_post));
  }

  return found;
}

/** A reshare's nested original, flattened into a post the store can hold. */
export function extractOriginalPost(dto: PostDto): PostDto | null {
  if (!dto.original_post || !dto.original_post.available) return null;
  return dto.original_post;
}

export function mapComment(dto: CommentDto): Comment {
  return {
    id: String(dto.id),
    postId: String(dto.post_id),
    // A tombstone withholds its author; the domain model allows any string, so
    // an empty author id signals "unknown" and pairs with `deleted: true`.
    authorId: dto.author_id ? toLocalId(dto.author_id) : "",
    parentId: dto.parent_id ? String(dto.parent_id) : undefined,
    text: dto.text ?? "",
    createdAt: dto.created_at ?? new Date().toISOString(),
    deleted: Boolean(dto.deleted),
  };
}

/** Root comments plus their inlined replies, flattened as phase 1 expects. */
export function flattenComments(list: CommentDto[]): Comment[] {
  const flat: Comment[] = [];

  list.forEach((dto) => {
    flat.push(mapComment(dto));
    (dto.replies ?? []).forEach((reply) => flat.push(mapComment(reply)));
  });

  return flat;
}

export function mapJob(dto: JobDto): Job {
  return {
    id: String(dto.id),
    title: dto.title ?? "",
    schoolName: dto.school?.name ?? "",
    schoolLogoUrl: dto.school?.logo_url ?? undefined,
    schoolSummary: dto.school?.summary ?? "",
    location: dto.location ?? "",
    subjects: dto.subjects ?? [],
    qualification: dto.qualification ?? "",
    level: dto.level ?? "",
    experienceYears: Number(dto.experience_years ?? 0),
    employmentType: dto.employment_type,
    description: dto.description ?? "",
    responsibilities: dto.responsibilities ?? [],
    publishedAt: dto.published_at ?? new Date().toISOString(),
    deadline: dto.deadline ?? "",
    positions: dto.positions ?? undefined,
    saved: Boolean(dto.saved),
    recommended: Boolean(dto.recommended),
  };
}

export function mapApplication(dto: JobApplicationDto): JobApplication {
  return {
    id: String(dto.id),
    jobId: String(dto.job_id),
    teacherId: toLocalId(dto.teacher_id),
    motivation: dto.motivation ?? "",
    availability: dto.availability ?? "",
    status: dto.status,
    submittedAt: dto.submitted_at ?? new Date().toISOString(),
    updatedAt: dto.updated_at ?? dto.submitted_at ?? new Date().toISOString(),
  };
}

export function mapMessage(dto: MessageDto): Message {
  return {
    id: String(dto.id),
    conversationId: String(dto.conversation_id),
    senderId: toLocalId(dto.sender_id),
    kind: dto.kind as MessageKind,
    text: dto.text ?? undefined,
    mediaUri: dto.media_url ?? undefined,
    sharedId: dto.shared_id ? toLocalId(dto.shared_id) : undefined,
    sentAt: dto.sent_at ?? new Date().toISOString(),
    // `sending` is a client-only optimistic state; the server only ever reports
    // sent or read.
    status: dto.status === "read" ? "read" : "sent",
  };
}

/**
 * Conversations arrive without their message history — that is a separate
 * endpoint — so existing messages are carried over and only replaced when the
 * thread is actually loaded.
 */
export function mapConversation(
  dto: ConversationDto,
  existingMessages: Message[] = [],
): Conversation {
  return {
    id: String(dto.id),
    participantIds: (dto.participant_ids ?? []).map(toLocalId),
    messages: dto.last_message
      ? mergeMessages(existingMessages, [mapMessage(dto.last_message)])
      : existingMessages,
    unreadCount: Number(dto.unread_count ?? 0),
    updatedAt: dto.updated_at ?? new Date().toISOString(),
  };
}

/** Union by id, ordered oldest-first as the thread UI renders it. */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();
  current.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => byId.set(message.id, message));

  return Array.from(byId.values()).sort((a, b) => {
    const order = a.sentAt.localeCompare(b.sentAt);
    return order !== 0 ? order : a.id.localeCompare(b.id);
  });
}

/**
 * Typed destination → in-app route.
 *
 * The backend deliberately returns `{type, params}` instead of a URL so a
 * notification cannot deep-link anywhere it likes. Mapping to a concrete
 * Expo Router path is therefore the client's job, and unknown types fall back to
 * the notifications screen rather than crashing navigation.
 */
export function mapNotificationDestination(dto: NotificationDto): string {
  const params = dto.destination?.params ?? {};

  switch (dto.destination?.type) {
    case "post":
    case "post_comment":
      return params.post_id ? `/social/post/${params.post_id}` : "/social/notifications";
    case "teacher_profile":
      return params.teacher_id
        ? `/social/profile/${toLocalId(String(params.teacher_id))}`
        : "/social/notifications";
    case "conversation_with_teacher":
      return "/social/conversations";
    case "job_application":
      return "/social/applications";
    case "job":
      return params.job_id ? `/social/job/${params.job_id}` : "/social/applications";
    case "school_activity":
      return "/social/notifications";
    default:
      return "/social/notifications";
  }
}

export function mapNotification(dto: NotificationDto): SocialNotification {
  return {
    id: String(dto.id),
    category: dto.category as NotificationCategory,
    title: dto.title ?? "",
    body: dto.body ?? "",
    createdAt: dto.created_at ?? new Date().toISOString(),
    read: Boolean(dto.read),
    actorId: dto.actor_id ? toLocalId(dto.actor_id) : undefined,
    destination: mapNotificationDestination(dto),
  };
}
