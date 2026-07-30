import { Comment } from "@/social/models";
import { CommentsRepository } from "@/social/repositories/contracts";
import { CommentDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { flattenComments, mapComment, mapTeacher } from "@/social/api/mappers";
import { socialStore } from "@/social/store/socialStore";

/**
 * Comments and single-level replies.
 *
 * The contract's `getComments(postId)` returns a flat `Comment[]`, which is what
 * the post detail screen groups by `parentId`. The API returns root comments each
 * carrying a bounded first page of replies, so the mapper flattens that back into
 * one array. Replies beyond the inlined page are fetched by `loadReplies`.
 */
export class CommentsApiRepository implements CommentsRepository {
  async getComments(postId: string): Promise<Comment[]> {
    const page = await socialApi.getPage<CommentDto>(`/social/posts/${postId}/comments`, {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    this.absorbAuthors(page.data);

    const comments = flattenComments(page.data);
    socialStore.replaceCommentsForPost(postId, comments);

    return comments;
  }

  async addComment(postId: string, text: string, parentId?: string): Promise<Comment> {
    const dto = await socialApi.post<CommentDto>(`/social/posts/${postId}/comments`, {
      body: { text, parent_id: parentId ? Number(parentId) : undefined },
    });

    this.absorbAuthors([dto]);

    const comment = mapComment(dto);
    socialStore.upsertComments([comment]);

    // The post's comment counter is server-owned; mirror the increment so the
    // feed card updates without refetching the whole post.
    const post = socialStore.findPost(postId);
    if (post) socialStore.patchPost(postId, { commentCount: post.commentCount + 1 });

    return comment;
  }

  /**
   * Deletes the current teacher's comment.
   *
   * A comment with replies comes back as a tombstone the thread still renders;
   * a leaf comment answers 204 and is removed outright. Both cases are the
   * server's decision, so nothing is assumed locally.
   */
  async deleteComment(id: string): Promise<void> {
    const existing = socialStore.getSnapshot().comments.find((comment) => comment.id === id);

    const tombstone = await socialApi.delete<CommentDto | undefined>(
      `/social/comments/${id}`,
    );

    if (tombstone) {
      socialStore.upsertComments([mapComment(tombstone)]);
    } else {
      socialStore.removeComment(id);
    }

    if (existing) {
      const post = socialStore.findPost(existing.postId);
      if (post) {
        socialStore.patchPost(existing.postId, {
          commentCount: Math.max(0, post.commentCount - 1),
        });
      }
    }
  }

  /**
   * Additional replies for one root comment.
   *
   * Not part of `CommentsRepository` — it is an extra capability the real API
   * offers and the contract has no method for. Exposed here so a future "show
   * more replies" affordance can use it without a contract change.
   */
  async loadReplies(commentId: string, cursor?: string): Promise<{
    replies: Comment[];
    nextCursor?: string;
  }> {
    const page = await socialApi.getPage<CommentDto>(
      `/social/comments/${commentId}/replies`,
      { query: { cursor, limit: SOCIAL_NETWORK.pageSize } },
    );

    this.absorbAuthors(page.data);

    const replies = page.data.map(mapComment);
    socialStore.upsertComments(replies);

    return { replies, nextCursor: page.meta.next_cursor ?? undefined };
  }

  /** Comment authors feed the same teacher cache screens look names up in. */
  private absorbAuthors(dtos: CommentDto[]): void {
    const teachers = dtos
      .flatMap((dto) => [dto.author, ...(dto.replies ?? []).map((reply) => reply.author)])
      .filter((author): author is NonNullable<typeof author> => Boolean(author))
      .map(mapTeacher);

    socialStore.upsertTeachers(teachers);
  }
}
