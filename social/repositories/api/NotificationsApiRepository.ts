import { NotificationCategory, SocialNotification } from "@/social/models";
import { NotificationsRepository } from "@/social/repositories/contracts";
import { NotificationDto, UnreadCountsDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { mapNotification } from "@/social/api/mappers";
import { socialStore } from "@/social/store/socialStore";

/**
 * Unified notifications across all three categories.
 *
 * `social` and `jobs` are stored rows; `school` is a read-only projection the
 * backend builds from the existing `activities` table. That distinction is
 * entirely server-side — this repository just asks for a category and renders what
 * comes back. No school-notification logic is reimplemented here, and the
 * pre-existing school/announcement integrations are untouched.
 *
 * Ids are source-prefixed by the server (`n_` for stored, `a_` for projected) so a
 * mark-as-read call routes itself back to the right store.
 */
export class NotificationsApiRepository implements NotificationsRepository {
  /**
   * Fetches one category, or the stored categories when none is given.
   *
   * The server paginates `school` against a different table from `social`/`jobs`,
   * so an uncategorised request deliberately returns only the stored ones — mixing
   * both into a single offset cursor produces unstable pages. The notifications
   * screen requests each tab explicitly, which is how phase 1 already built it.
   */
  async getNotifications(category?: NotificationCategory): Promise<SocialNotification[]> {
    const page = await socialApi.getPage<NotificationDto>("/notifications", {
      query: { category, limit: SOCIAL_NETWORK.pageSize },
    });

    const notifications = page.data.map(mapNotification);

    if (category) {
      socialStore.replaceNotificationCategory(category, notifications);
    } else {
      socialStore.upsertNotifications(notifications);
    }

    return notifications;
  }

  /** All three categories, for the notifications screen's tab counts. */
  async getAllCategories(): Promise<SocialNotification[]> {
    const categories: NotificationCategory[] = ["social", "jobs", "school"];

    // Independent requests: a failing school projection must not blank the social
    // tab, so each category settles on its own.
    const results = await Promise.allSettled(
      categories.map((category) => this.getNotifications(category)),
    );

    return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  }

  async markRead(id: string): Promise<void> {
    socialStore.markNotificationRead(id);

    try {
      await socialApi.put<{ id: string; read: boolean }>(`/notifications/${id}/read`, {
        body: {},
      });
    } catch (cause) {
      // Re-read the category so the badge cannot drift from the server.
      const category = socialStore
        .getSnapshot()
        .notifications.find((notification) => notification.id === id)?.category;

      if (category) await this.getNotifications(category).catch(() => undefined);

      throw cause;
    }
  }

  async markCategoryRead(category: NotificationCategory): Promise<void> {
    socialStore.markCategoryRead(category);

    try {
      await socialApi.put<{ category: string; marked: number }>("/notifications/read", {
        body: { category },
      });
    } catch (cause) {
      await this.getNotifications(category).catch(() => undefined);
      throw cause;
    }
  }

  /** Per-category unread counts plus the unread message count, in one request. */
  async getUnreadCounts(): Promise<UnreadCountsDto> {
    return socialApi.get<UnreadCountsDto>("/notifications/unread-counts");
  }
}
