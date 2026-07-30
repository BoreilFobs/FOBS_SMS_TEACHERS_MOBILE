import { SocialTeacher } from "@/social/models";
import { ModerationRepository, NetworkRepository } from "@/social/repositories/contracts";
import { FollowStateDto, OwnProfileDto, ReportReceiptDto, TeacherDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { mapTeacher } from "@/social/api/mappers";
import {
  isCurrentTeacher,
  setCurrentTeacherId,
  toRemoteId,
} from "@/social/api/identity";
import { socialStore } from "@/social/store/socialStore";

/**
 * The social graph: directory, follow/unfollow, discovery, profiles, blocking and
 * reporting.
 *
 * `NetworkRepository` and `ModerationRepository` are implemented together because
 * blocking sits in both — it is a moderation action with graph consequences, and
 * the backend applies both in one transaction.
 */
export class NetworkApiRepository implements NetworkRepository, ModerationRepository {
  /**
   * Directory of teachers.
   *
   * The contract is `getTeachers(): Promise<SocialTeacher[]>` with no pagination,
   * so this returns the first page and seeds the cache. The network screen filters
   * and ranks what the cache holds; suggestions and trending have their own
   * server-ranked endpoints below.
   */
  async getTeachers(): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>("/social/teachers", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  /**
   * Follow/unfollow.
   *
   * The contract exposes a single `follow(teacherId)` toggle, so the current
   * cached state decides the direction. Counters are taken from the server's
   * response rather than incremented locally.
   */
  async follow(teacherId: string): Promise<void> {
    const remoteId = toRemoteId(teacherId);
    const cached = this.cached(teacherId);
    const shouldFollow = !cached?.followedByCurrentUser;

    const state = shouldFollow
      ? await socialApi.put<FollowStateDto>(`/social/teachers/${remoteId}/follow`)
      : await socialApi.delete<FollowStateDto>(`/social/teachers/${remoteId}/follow`);

    socialStore.patchTeacher(teacherId, {
      followedByCurrentUser: Boolean(state.following),
      followsCurrentUser: Boolean(state.follows_you),
    });

    // Follower/following counts and the mutual flag changed on both profiles.
    // Refetching the pair is cheaper and more truthful than local arithmetic.
    await Promise.all([this.refreshTeacher(teacherId), this.refreshOwnProfile()]);
  }

  /**
   * Blocks a teacher.
   *
   * The server removes both follow edges and revokes messaging eligibility in one
   * transaction, so the local cache mirrors all of it: the teacher is marked
   * blocked, their posts are dropped from the feed, and any conversation with them
   * disappears from the list.
   */
  async block(teacherId: string): Promise<void> {
    await socialApi.put<void>(`/social/teachers/${toRemoteId(teacherId)}/block`);

    socialStore.patchTeacher(teacherId, {
      blocked: true,
      followedByCurrentUser: false,
      followsCurrentUser: false,
    });
    socialStore.removePostsByAuthor(teacherId);
    socialStore.removeConversationsWith(teacherId);

    await this.refreshOwnProfile();
  }

  async unblock(teacherId: string): Promise<void> {
    await socialApi.delete<void>(`/social/teachers/${toRemoteId(teacherId)}/block`);

    socialStore.patchTeacher(teacherId, { blocked: false });

    // Unblocking does not restore the removed follow edges — the server is
    // explicit about that — so re-read rather than assume the prior state.
    await this.refreshTeacher(teacherId);
  }

  /**
   * Reports a post.
   *
   * The contract passes a free-text `reason`, but the API accepts a fixed
   * vocabulary and puts prose in `details`. Anything outside the vocabulary is
   * therefore sent as `other` plus the original text, so no reason is lost.
   */
  async reportPost(postId: string, reason: string): Promise<void> {
    const known = [
      "spam",
      "harassment",
      "hate_speech",
      "misinformation",
      "inappropriate_content",
      "impersonation",
      "other",
    ];

    const normalized = reason.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const isKnown = known.includes(normalized);

    await socialApi.post<ReportReceiptDto>(`/social/posts/${postId}/reports`, {
      body: {
        reason: isKnown ? normalized : "other",
        details: isKnown ? undefined : reason.trim() || undefined,
      },
    });

    socialStore.patchPost(postId, { reported: true });
    socialStore.addReport(postId, reason);
  }

  // ------------------------------------------------- beyond the phase 1 contract

  /** Server-ranked suggestions (shared subjects, schools, mutuals, city). */
  async getSuggestedTeachers(): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>("/social/teachers/suggested", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  /** Server-ranked trending teachers over a rolling 14-day window. */
  async getTrendingTeachers(): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>("/social/teachers/trending", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  async getBlockedTeachers(): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>("/social/blocked-teachers", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  async getFollowers(teacherId: string): Promise<SocialTeacher[]> {
    return this.teacherList(`/social/teachers/${toRemoteId(teacherId)}/followers`);
  }

  async getFollowing(teacherId: string): Promise<SocialTeacher[]> {
    return this.teacherList(`/social/teachers/${toRemoteId(teacherId)}/following`);
  }

  /**
   * One teacher's public professional profile.
   *
   * Self resolves to the owner endpoint, which also returns the visibility
   * switches the public resource withholds.
   */
  async getTeacher(teacherId: string): Promise<SocialTeacher | undefined> {
    try {
      const dto = isCurrentTeacher(teacherId)
        ? await socialApi.get<OwnProfileDto>("/teacher/professional-profile")
        : await socialApi.get<TeacherDto>(`/social/teachers/${toRemoteId(teacherId)}`);

      const teacher = mapTeacher(dto);
      socialStore.upsertTeachers([teacher]);

      return teacher;
    } catch (cause) {
      if (cause instanceof SocialApiError && cause.kind === "not-found") {
        return undefined;
      }
      throw cause;
    }
  }

  /**
   * Loads the signed-in teacher's own profile and registers the real id behind the
   * `CURRENT_TEACHER_ID` sentinel. Must run before any other social call so ids
   * translate correctly.
   */
  async refreshOwnProfile(): Promise<SocialTeacher> {
    const dto = await socialApi.get<OwnProfileDto>("/teacher/professional-profile");

    setCurrentTeacherId(String(dto.id));

    const teacher = mapTeacher(dto);
    socialStore.upsertTeachers([teacher]);

    return teacher;
  }

  /** Updates the social-only profile fields the backend owns. */
  async updateOwnProfile(changes: Partial<SocialTeacher>): Promise<SocialTeacher> {
    const body: Record<string, unknown> = {};

    if (changes.headline !== undefined) body.headline = changes.headline;
    if (changes.city !== undefined) body.city = changes.city;
    if (changes.biography !== undefined) body.biography = changes.biography;
    if (changes.yearsExperience !== undefined) body.years_experience = changes.yearsExperience;
    if (changes.skills !== undefined) body.skills = changes.skills;
    if (changes.languages !== undefined) body.languages = changes.languages;
    if (changes.certifications !== undefined) body.certifications = changes.certifications;
    if (changes.levels !== undefined) body.educational_levels = changes.levels;

    const dto = await socialApi.patch<OwnProfileDto>("/teacher/professional-profile", { body });

    setCurrentTeacherId(String(dto.id));

    const teacher = mapTeacher(dto);
    socialStore.upsertTeachers([teacher]);

    return teacher;
  }

  // ------------------------------------------------------------------- internals

  private async teacherList(path: string): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>(path, {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  private async refreshTeacher(teacherId: string): Promise<void> {
    if (isCurrentTeacher(teacherId)) return;

    try {
      const dto = await socialApi.get<TeacherDto>(
        `/social/teachers/${toRemoteId(teacherId)}`,
      );
      socialStore.upsertTeachers([mapTeacher(dto)]);
    } catch (cause) {
      // A block in either direction hides the profile. The local cache already
      // reflects the outcome, so this is not worth surfacing.
      if (cause instanceof SocialApiError && cause.kind === "not-found") return;
      throw cause;
    }
  }

  private cached(teacherId: string): SocialTeacher | undefined {
    return socialStore.getSnapshot().teachers.find((teacher) => teacher.id === teacherId);
  }
}
