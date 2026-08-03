/**
 * Wire types for the professional-network API.
 *
 * These mirror the Laravel API Resources one-to-one (snake_case, string ids).
 * Nothing outside `social/api/mappers.ts` should import from this file — the rest
 * of the app works with the camelCase domain models in `social/models`.
 *
 * Source of truth: FOBS_SMS_API_WEB `app/Http/Resources/Social/*` and
 * `docs/teacher-social-network.md`.
 */

export interface TeacherDto {
  id: string;
  name: string;
  headline: string;
  biography: string;
  photo_url: string | null;
  city: string;
  specialization: string;
  subjects: string[];
  levels: string[];
  qualifications: string[];
  certifications: string[];
  skills: string[];
  languages: string[];
  years_experience: number;
  experience_summary: string;
  school_names: string[];
  verified: boolean;
  profile_completion: number;
  follower_count: number;
  following_count: number;
  post_count: number;
  engagement_score: number;
  is_self: boolean;
  followed_by_current_user: boolean;
  follows_current_user: boolean;
  mutual: boolean;
  blocked: boolean;
  /** Present only when the owning teacher published it. */
  professional_email?: string;
  professional_phone?: string;
  /** Suggestion metadata, only on GET /social/teachers/suggested. */
  suggestion_reason?: string;
  suggestion_score?: number;
}

export interface OwnProfileDto extends TeacherDto {
  visibility: {
    professional_email: boolean;
    professional_phone: boolean;
    current_schools: boolean;
  };
}

export interface SchoolSummaryDto {
  id: string;
  name: string;
  acronym: string;
  logo_url: string | null;
  summary: string;
  location: string;
}

export interface PostImageDto {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
}

export interface PollOptionDto {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  selected: boolean;
}

export interface PollDto {
  id: string;
  question: string;
  multiple: boolean;
  total_votes: number;
  current_user_option_ids: string[];
  has_voted: boolean;
  options: PollOptionDto[];
}

export interface ReactionSummaryDto {
  total: number;
  breakdown: Record<string, number>;
}

/** A reshare whose original is gone or hidden renders as a tombstone. */
export type OriginalPostDto =
  | ({ available: true } & PostDto)
  | { available: false; reason: "deleted" | "blocked"; message: string; id?: string; author_id?: string };

export interface PostDto {
  id: string;
  type: "text" | "image" | "poll" | "question" | "reshare" | "quote";
  author: TeacherDto | null;
  author_id: string;
  text: string;
  category: string | null;
  location: string | null;
  school: SchoolSummaryDto | null;
  images: PostImageDto[];
  tagged_teachers: { id: string; name: string }[];
  hashtags: string[];
  reactions: ReactionSummaryDto;
  current_user_reaction: string | null;
  comment_count: number;
  reshare_count: number;
  saved: boolean;
  reported: boolean;
  created_at: string | null;
  edited_at: string | null;
  recommendation_reason: string | null;
  question_title?: string;
  poll?: PollDto;
  original_post_id?: string | null;
  quote_text?: string | null;
  original_post?: OriginalPostDto | null;
}

export interface CommentDto {
  id: string;
  post_id: string;
  parent_id: string | null;
  deleted: boolean;
  text: string;
  placeholder: string | null;
  created_at: string | null;
  author_id: string | null;
  author: TeacherDto | null;
  replies?: CommentDto[];
  reply_count?: number;
}

export interface JobDto {
  id: string;
  title: string;
  school: SchoolSummaryDto | null;
  location: string;
  subjects: string[];
  qualification: string;
  level: string;
  experience_years: number;
  employment_type: "full-time" | "part-time" | "contract" | "temporary";
  description: string;
  responsibilities: string[];
  positions: number;
  published_at: string | null;
  deadline: string | null;
  open: boolean;
  saved: boolean;
  recommended: boolean;
  recommendation_reason: string | null;
  application: JobApplicationDto | null;
}

export interface JobApplicationDto {
  id: string;
  job_id: string;
  teacher_id: string;
  motivation: string;
  availability: string;
  status: "submitted" | "viewed" | "accepted" | "rejected";
  editable: boolean;
  submitted_at: string | null;
  updated_at: string | null;
  status_changed_at: string | null;
  job?: {
    id: string;
    title: string;
    location: string;
    employment_type: string;
    deadline: string | null;
    school: SchoolSummaryDto | null;
  };
}

export interface MessageDto {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: "text" | "image" | "post" | "job" | "profile";
  text: string | null;
  media_url: string | null;
  shared_id: string | null;
  client_id: string | null;
  sent_at: string | null;
  status: "sent" | "read";
  deleted?: boolean;
  edited_at?: string | null;
  forwarded?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  reply_to?: {
    id: string;
    sender_id: string;
    kind: string;
    text?: string | null;
    deleted?: boolean;
  } | null;
}

export interface ConversationDto {
  id: string;
  participant_ids: string[];
  other_participant: TeacherDto | null;
  unread_count: number;
  /** Server-evaluated per response: mutual follow still intact, no block. */
  can_send: boolean;
  last_message: MessageDto | null;
  updated_at: string | null;
}

export interface NotificationDto {
  id: string;
  category: "social" | "jobs" | "school";
  type: string;
  title: string;
  body: string | null;
  actor_id: string | null;
  /** Typed destination; the server never returns a client URL. */
  destination: {
    type: string | null;
    params: Record<string, unknown>;
  };
  read: boolean;
  read_at: string | null;
  created_at: string | null;
}

export interface UnreadCountsDto {
  social: number;
  jobs: number;
  school: number;
  messages: number;
  total: number;
}

export interface MediaDto {
  id: string;
  url: string;
  thumbnail_url: string;
  alt_text: string | null;
  status: string;
}

export interface ReactionStateDto {
  current_reaction: string | null;
  summary: ReactionSummaryDto;
}

export interface FollowStateDto {
  following: boolean;
  follows_you: boolean;
  mutual: boolean;
  became_mutual?: boolean;
}

export interface SearchResultsDto {
  teachers: TeacherDto[];
  posts: PostDto[];
  jobs: JobDto[];
}

export interface SavedStateDto {
  saved: boolean;
}

export interface ReportReceiptDto {
  id: string;
  status: string;
}

export interface ReadReceiptDto {
  unread_count: number;
  read_at: string;
  through_message_id: number | null;
}
