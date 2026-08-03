import Config from "@/constants/Config";
import { fetchJson } from "@/services/fetchJson";
import type { SchoolAnnouncement } from "@/models/updates";

interface AnnouncementDto {
  id: string;
  school_id: string;
  school_name: string | null;
  school_acronym: string | null;
  title: string;
  body: string;
  excerpt: string;
  pinned: boolean;
  author_name: string | null;
  published_at: string | null;
  read: boolean;
}

/**
 * School announcements from the server.
 *
 * These used to come from `services/mock`. The API is read-only for teachers —
 * authoring lives on the admin side — so this module only fetches and marks read.
 */
export async function fetchAnnouncements(): Promise<SchoolAnnouncement[]> {
  const payload = await fetchJson<{ data?: AnnouncementDto[] }>(
    `${Config.apiBaseUrl}/social/announcements`,
  );

  return (payload.data ?? []).map(mapAnnouncement);
}

export async function markAnnouncementRead(id: string): Promise<void> {
  await fetchJson(`${Config.apiBaseUrl}/social/announcements/${id}/read`, {
    method: "PUT",
  });
}

function mapAnnouncement(dto: AnnouncementDto): SchoolAnnouncement {
  return {
    id: String(dto.id),
    schoolId: Number(dto.school_id),
    schoolName: dto.school_name ?? "",
    schoolAcronym: dto.school_acronym ?? (dto.school_name ?? "").slice(0, 4).toUpperCase(),
    title: dto.title,
    excerpt: dto.excerpt,
    // The detail screen renders paragraphs, so split the stored body on blank
    // lines rather than inventing a separate field for it.
    message: dto.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
    publisher: dto.author_name ?? dto.school_name ?? "",
    publisherRole: "School administrator",
    publishedAt: dto.published_at ?? new Date().toISOString(),
    // The server does not model priority; pinned is the only emphasis it has.
    priority: dto.pinned ? "important" : "normal",
    pinned: Boolean(dto.pinned),
    isRead: Boolean(dto.read),
    attachments: [],
  };
}
