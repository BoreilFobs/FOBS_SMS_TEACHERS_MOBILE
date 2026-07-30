import { Conversation, Message, SharedMessageInput, SocialTeacher } from "@/social/models";
import { MessagingRepository } from "@/social/repositories/contracts";
import { ConversationDto, MessageDto, ReadReceiptDto, TeacherDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { mapConversation, mapMessage, mapTeacher } from "@/social/api/mappers";
import { getCurrentTeacherId, toRemoteId } from "@/social/api/identity";
import { uploadImage } from "@/social/api/media";
import { socialStore } from "@/social/store/socialStore";
import { CURRENT_TEACHER_ID } from "@/social/models";

/**
 * One-to-one messaging between mutual followers.
 *
 * Eligibility is enforced server-side and re-checked on every send, because a
 * follow can be revoked after a conversation exists. The client keeps its UI guard
 * (a conversation whose `can_send` is false renders read-only) but never treats it
 * as the authority — a send that the server refuses surfaces
 * `MUTUAL_FOLLOW_REQUIRED` or `BLOCK_CONFLICT` with the server's own message.
 */
export class MessagingApiRepository implements MessagingRepository {
  /** Conversations whose thread may still accept a new message. */
  private sendable = new Map<string, boolean>();

  async getConversations(query?: string): Promise<Conversation[]> {
    const page = await socialApi.getPage<ConversationDto>("/social/conversations", {
      query: { q: query, limit: SOCIAL_NETWORK.pageSize },
    });

    return this.absorb(page.data);
  }

  /**
   * Teachers a conversation may be opened with: the current mutual followers,
   * resolved by the server from the live follow graph.
   */
  async getEligibleTeachers(): Promise<SocialTeacher[]> {
    const page = await socialApi.getPage<TeacherDto>("/social/eligible-teachers", {
      query: { limit: SOCIAL_NETWORK.pageSize },
    });

    const teachers = page.data.map(mapTeacher);
    socialStore.upsertTeachers(teachers);

    return teachers;
  }

  /**
   * Opens or reuses the conversation with a teacher.
   *
   * Idempotent server-side, so calling it twice returns the same conversation
   * rather than creating a duplicate.
   */
  async startConversation(teacherId: string): Promise<Conversation> {
    const dto = await socialApi.post<ConversationDto>("/social/conversations", {
      body: { teacher_id: Number(toRemoteId(teacherId)) },
    });

    return this.absorb([dto])[0];
  }

  /** Loads a thread's history and caches it on the conversation. */
  async getMessages(conversationId: string, cursor?: string): Promise<{
    messages: Message[];
    nextCursor?: string;
  }> {
    const page = await socialApi.getPage<MessageDto>(
      `/social/conversations/${conversationId}/messages`,
      { query: { cursor, limit: SOCIAL_NETWORK.pageSize } },
    );

    const messages = page.data.map(mapMessage);
    socialStore.setConversationMessages(conversationId, messages);

    return { messages, nextCursor: page.meta.next_cursor ?? undefined };
  }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    return this.send(conversationId, { type: "text", text: text.trim() }, {
      kind: "text",
      text: text.trim(),
    });
  }

  /**
   * Uploads the picked image first, then sends a message referencing it.
   *
   * The optimistic bubble shows the local URI so the thread feels immediate, but
   * once the server confirms, the message carries the hosted URL and the local URI
   * is discarded — nothing keeps rendering from a `file://` path.
   */
  async sendImage(conversationId: string, uri: string): Promise<Message> {
    const media = await uploadImage({ uri });

    return this.send(
      conversationId,
      { type: "image", media_id: Number(media.id) },
      { kind: "image", mediaUri: uri },
    );
  }

  async share(conversationId: string, input: SharedMessageInput): Promise<Message> {
    return this.send(
      conversationId,
      {
        type: input.kind,
        shared_id: Number(
          input.kind === "profile" ? toRemoteId(input.sharedId) : input.sharedId,
        ),
        text: input.text?.trim() || undefined,
      },
      { kind: input.kind, sharedId: input.sharedId, text: input.text?.trim() },
    );
  }

  async markConversationRead(conversationId: string): Promise<void> {
    const receipt = await socialApi.put<ReadReceiptDto>(
      `/social/conversations/${conversationId}/read`,
      { body: {} },
    );

    socialStore.patchConversation(conversationId, {
      unreadCount: Number(receipt.unread_count ?? 0),
    });
  }

  /** Whether the server currently allows sending in this conversation. */
  canSend(conversationId: string): boolean {
    return this.sendable.get(conversationId) ?? true;
  }

  // ------------------------------------------------------------------- internals

  /**
   * Shared send path: optimistic bubble, real request, reconcile or roll back.
   *
   * A `client_id` makes the send idempotent — if the response is lost and the user
   * retries, the server returns the original message instead of duplicating it.
   */
  private async send(
    conversationId: string,
    body: Record<string, unknown>,
    optimistic: Partial<Message> & { kind: Message["kind"] },
  ): Promise<Message> {
    const clientId = generateClientId();
    const temporaryId = `pending-${clientId}`;

    const placeholder: Message = {
      id: temporaryId,
      conversationId,
      senderId: getCurrentTeacherId() ?? CURRENT_TEACHER_ID,
      kind: optimistic.kind,
      text: optimistic.text,
      mediaUri: optimistic.mediaUri,
      sharedId: optimistic.sharedId,
      sentAt: new Date().toISOString(),
      status: "sending",
    };

    const rollback = socialStore.addOptimisticMessage(conversationId, placeholder);

    try {
      const dto = await socialApi.post<MessageDto>(
        `/social/conversations/${conversationId}/messages`,
        { body: { ...body, client_id: clientId } },
      );

      const confirmed = mapMessage(dto);
      socialStore.confirmMessage(conversationId, temporaryId, confirmed);

      return confirmed;
    } catch (cause) {
      rollback();

      // Eligibility was revoked between opening the thread and sending. Mark the
      // conversation read-only so the composer disables itself immediately.
      if (
        cause instanceof SocialApiError &&
        ["MUTUAL_FOLLOW_REQUIRED", "BLOCK_CONFLICT"].includes(cause.code)
      ) {
        this.sendable.set(conversationId, false);
      }

      throw cause;
    }
  }

  private absorb(dtos: ConversationDto[]): Conversation[] {
    const teachers = dtos
      .map((dto) => dto.other_participant)
      .filter((teacher): teacher is TeacherDto => Boolean(teacher))
      .map(mapTeacher);

    socialStore.upsertTeachers(teachers);

    const conversations = dtos.map((dto) => {
      this.sendable.set(String(dto.id), Boolean(dto.can_send));

      const existing = socialStore
        .getSnapshot()
        .conversations.find((candidate) => candidate.id === String(dto.id));

      return mapConversation(dto, existing?.messages ?? []);
    });

    socialStore.upsertConversations(conversations);

    return conversations;
  }
}

/**
 * RFC 4122 v4 identifier, used purely as an idempotency key. `crypto.randomUUID`
 * is not available on every React Native runtime, and the project has no uuid
 * dependency, so this builds one from Math.random — collision risk is irrelevant
 * for a per-send key scoped to one conversation.
 */
function generateClientId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
