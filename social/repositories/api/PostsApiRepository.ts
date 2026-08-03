import { FeedPage, PostDraft, ReactionType, SocialPost } from "@/social/models";
import { PostsRepository, SocialFeedRepository } from "@/social/repositories/contracts";
import { PostDto, ReactionStateDto, SavedStateDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import {
  collectTeachersFromPost,
  extractOriginalPost,
  mapPost,
  mapReactionSummary,
  mapTeacher,
} from "@/social/api/mappers";
import { uploadImages, type LocalImage } from "@/social/api/media";
import { mediaIdForUrl } from "@/social/api/mediaRegistry";
import { toRemoteId } from "@/social/api/identity";
import { socialStore } from "@/social/store/socialStore";

/**
 * Feed, posts, reactions, saves, reshares and poll voting.
 *
 * Implements `SocialFeedRepository` and `PostsRepository` byte-for-byte as phase 1
 * declared them. Every response is written into `socialStore` so the snapshot the
 * screens read stays current.
 */
export class PostsApiRepository implements SocialFeedRepository, PostsRepository {
  /**
   * Absorbs a page of posts into the store: the posts themselves, the reshare
   * originals nested inside them, and every author summary they carry. Doing this
   * in one place is what keeps a feed page down to a single request.
   */
  private absorb(dtos: PostDto[]): SocialPost[] {
    const posts: SocialPost[] = [];
    const originals: SocialPost[] = [];
    const teachers = dtos.flatMap(collectTeachersFromPost).map(mapTeacher);

    dtos.forEach((dto) => {
      posts.push(mapPost(dto));

      const original = extractOriginalPost(dto);
      if (original) originals.push(mapPost(original));
    });

    socialStore.upsertTeachers(teachers);
    // Originals first so a reshare's own row wins if both are present.
    socialStore.upsertPosts([...originals, ...posts]);

    return posts;
  }

  private absorbOne(dto: PostDto): SocialPost {
    return this.absorb([dto])[0];
  }

  // ------------------------------------------------------- SocialFeedRepository

  async getFeed(cursor?: string, limit: number = SOCIAL_NETWORK.pageSize): Promise<FeedPage> {
    const page = await socialApi.getPage<PostDto>("/social/feed", {
      query: { cursor, limit },
    });

    return {
      items: this.absorb(page.data),
      // The server returns null on the last page; the contract wants undefined.
      nextCursor: page.meta.next_cursor ?? undefined,
    };
  }

  refreshFeed(): Promise<FeedPage> {
    return this.getFeed(undefined, SOCIAL_NETWORK.pageSize);
  }

  // ------------------------------------------------------------ PostsRepository

  async getPost(id: string): Promise<SocialPost | undefined> {
    try {
      const dto = await socialApi.get<PostDto>(`/social/posts/${id}`);
      return this.absorbOne(dto);
    } catch (cause) {
      // A deleted or blocked post is a legitimate "not there", not an error the
      // detail screen should show as a failure.
      if (cause instanceof SocialApiError && cause.kind === "not-found") {
        socialStore.removePost(id);
        return undefined;
      }
      throw cause;
    }
  }

  async createPost(
    draft: PostDraft,
    onProgress?: (fraction: number) => void,
  ): Promise<SocialPost> {
    const mediaIds = await this.resolveDraftMedia(draft, onProgress);

    const dto = await socialApi.post<PostDto>("/social/posts", {
      body: this.draftToBody(draft, mediaIds),
    });

    return this.absorbOne(dto);
  }

  async editPost(
    id: string,
    draft: PostDraft,
    onProgress?: (fraction: number) => void,
  ): Promise<SocialPost> {
    const mediaIds = await this.resolveDraftMedia(draft, onProgress);

    const dto = await socialApi.patch<PostDto>(`/social/posts/${id}`, {
      body: this.draftToBody(draft, mediaIds),
    });

    return this.absorbOne(dto);
  }

  async deletePost(id: string): Promise<void> {
    await socialApi.delete<void>(`/social/posts/${id}`);
    socialStore.removePost(id);
  }

  /**
   * Add, change, or clear the current teacher's reaction.
   *
   * Optimistically toggles so the icon responds instantly, then reconciles with
   * the authoritative summary the server returns. On failure the previous state
   * is restored — the counter is server-owned, so a diverged local guess would be
   * worse than a brief flicker.
   */
  async react(id: string, reaction?: ReactionType): Promise<void> {
    const before = socialStore.findPost(id);
    const previous = before?.currentUserReaction;
    const nextReaction = previous === reaction ? undefined : reaction;

    if (before) {
      const breakdown = { ...before.reactions.breakdown };
      if (previous) breakdown[previous] = Math.max(0, breakdown[previous] - 1);
      if (nextReaction) breakdown[nextReaction] += 1;

      socialStore.patchPost(id, {
        currentUserReaction: nextReaction,
        reactions: {
          total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
          breakdown,
        },
      });
    }

    try {
      const state =
        nextReaction === undefined
          ? await socialApi.delete<ReactionStateDto>(`/social/posts/${id}/reaction`)
          : await socialApi.put<ReactionStateDto>(`/social/posts/${id}/reaction`, {
              body: { type: nextReaction },
            });

      socialStore.patchPost(id, {
        currentUserReaction: (state.current_reaction as ReactionType | null) ?? undefined,
        reactions: mapReactionSummary(state.summary),
      });
    } catch (cause) {
      if (before) {
        socialStore.patchPost(id, {
          currentUserReaction: before.currentUserReaction,
          reactions: before.reactions,
        });
      }
      throw cause;
    }
  }

  /**
   * Toggles saved state. Uses the dedicated toggle endpoint so the single
   * `savePost(id)` operation in the phase 1 contract maps to one round trip.
   */
  async savePost(id: string): Promise<void> {
    const before = socialStore.findPost(id);

    if (before) socialStore.patchPost(id, { saved: !before.saved });

    try {
      const state = await socialApi.post<SavedStateDto>(`/social/posts/${id}/save/toggle`);
      socialStore.patchPost(id, { saved: Boolean(state.saved) });
    } catch (cause) {
      if (before) socialStore.patchPost(id, { saved: before.saved });
      throw cause;
    }
  }

  /**
   * Poll voting. No client-side duplicate-vote logic: the server replaces the
   * teacher's selection atomically and rejects invalid options, and its response
   * is what the UI renders.
   */
  async vote(id: string, optionIds: string[]): Promise<void> {
    const poll = await socialApi.put<{
      id: string;
      question: string;
      multiple: boolean;
      total_votes: number;
      current_user_option_ids: string[];
      has_voted: boolean;
      options: { id: string; text: string; votes: number }[];
    }>(`/social/posts/${id}/vote`, { body: { option_ids: optionIds.map(Number) } });

    const existing = socialStore.findPost(id);
    if (existing?.type !== "poll") {
      // Cache is stale; refetch rather than reconstruct a partial poll.
      await this.getPost(id);
      return;
    }

    socialStore.patchPost(id, {
      poll: {
        question: poll.question ?? existing.poll.question,
        multiple: Boolean(poll.multiple),
        currentUserOptionIds: (poll.current_user_option_ids ?? []).map(String),
        options: (poll.options ?? []).map((option) => ({
          id: String(option.id),
          text: option.text,
          votes: Number(option.votes ?? 0),
        })),
      },
    } as Partial<SocialPost>);
  }

  /**
   * The current teacher's saved posts.
   *
   * Not in the phase 1 contract — the saved screen previously filtered
   * `snapshot.posts` by `post.saved`, which only worked because the mock held every
   * post in memory. With a real backend, saves live server-side and need their own
   * endpoint.
   */
  async getSavedPosts(): Promise<SocialPost[]> {
    const page = await socialApi.getPage<PostDto>("/social/saved-posts", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    return this.absorb(page.data);
  }

  /** A profile's own posts, or its reshares — the two tabs are separate queries. */
  async getTeacherPosts(
    teacherId: string,
    kind: "posts" | "reshares" = "posts",
  ): Promise<SocialPost[]> {
    const page = await socialApi.getPage<PostDto>(
      `/social/teachers/${toRemoteId(teacherId)}/posts`,
      { query: { kind, limit: SOCIAL_NETWORK.pageSize } },
    );

    return this.absorb(page.data);
  }

  async reshare(id: string, quoteText?: string): Promise<SocialPost> {
    const dto = await socialApi.post<PostDto>(`/social/posts/${id}/reshares`, {
      body: quoteText?.trim() ? { quote_text: quoteText.trim() } : {},
    });

    const reshare = this.absorbOne(dto);

    // The original's reshare counter changed server-side; reflect it locally
    // without a second request.
    const original = socialStore.findPost(id);
    if (original) {
      socialStore.patchPost(id, { reshareCount: original.reshareCount + 1 });
    }

    return reshare;
  }

  // ------------------------------------------------------------------ internals

  /**
   * Turns a draft's images into server-side media ids.
   *
   * A draft carries local `file://` URIs from the picker on first publish, and
   * already-hosted `http(s)` URLs when editing a post whose images are unchanged.
   * Only the former need uploading; the latter are resolved back to their media
   * ids from the cached post so editing does not re-upload or drop them.
   */
  private async resolveDraftMedia(
    draft: PostDraft,
    onProgress?: (fraction: number) => void,
  ): Promise<number[]> {
    const local: LocalImage[] = [];
    const keptUrls: string[] = [];

    draft.images.forEach((uri, index) => {
      if (/^https?:\/\//i.test(uri)) {
        keptUrls.push(uri);
      } else {
        local.push({ uri, altText: draft.imageDescriptions?.[index] });
      }
    });

    const keptIds = keptUrls
      .map((url) => mediaIdForUrl(url))
      .filter((id): id is number => id !== null);

    if (local.length === 0) {
      onProgress?.(1);
      return keptIds;
    }

    const { uploaded, failures } = await uploadImages(local, { onProgress });

    if (failures.length > 0) {
      // Surface the first failure with its real reason so the composer can offer
      // a retry, and never publish a post that silently lost an image.
      throw failures[0].error;
    }

    return [...keptIds, ...uploaded.map((media) => Number(media.id))];
  }

  private draftToBody(draft: PostDraft, mediaIds: number[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      type: draft.type,
      text: draft.text,
      category: draft.category,
      location: draft.location,
      hashtags: draft.hashtags,
      tagged_teacher_ids: draft.taggedTeacherIds?.map(Number),
      media_ids: mediaIds,
    };

    if (draft.type === "question") {
      body.question_title = draft.questionTitle;
    }

    if (draft.type === "poll" && draft.poll) {
      body.poll = {
        question: draft.poll.question,
        multiple: draft.poll.multiple,
        options: draft.poll.options,
      };
    }

    // `schoolAffiliation` is a display name in the domain model; the API needs an
    // id and validates the teacher is actually assigned to it. Resolving names to
    // ids needs an endpoint phase 2 did not build, so the field is omitted rather
    // than guessed. See the migration doc's known limitations.
    return body;
  }
}
