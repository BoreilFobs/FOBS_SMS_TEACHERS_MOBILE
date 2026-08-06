import { readJson, writeJson } from "@/utils/offline/storage";

interface CacheEnvelope<T> {
  value: T;
  savedAt: string;
}

/**
 * Read-through cache for data that rarely changes — class lists, subjects,
 * enrolled students, the last feed page.
 *
 * Screens render the cached copy immediately and revalidate in the background,
 * so opening the app shows content instead of a skeleton, and a lost connection
 * degrades to slightly stale data rather than an empty screen.
 */
export async function readCache<T>(key: string): Promise<T | null> {
  const envelope = await readJson<CacheEnvelope<T>>(`cache.${key}`);
  return envelope?.value ?? null;
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await writeJson(`cache.${key}`, {
    value,
    savedAt: new Date().toISOString(),
  } satisfies CacheEnvelope<T>);
}

/** Stable cache keys, so screens cannot silently disagree on naming. */
export const cacheKeys = {
  feed: "feed.page1",
  classStudents: (classId: string | number) => `class.${classId}.students`,
  schoolClasses: (schoolId: string | number) => `school.${schoolId}.classes`,
  teacherSubjects: (schoolId: string | number, teacherId: string | number) =>
    `school.${schoolId}.teacher.${teacherId}.subjects`,
  marks: (classId: string | number, subjectId: string | number, examId: string | number) =>
    `marks.${classId}.${subjectId}.${examId}`,
  marksDraft: (classId: string | number, subjectId: string | number, examId: string | number) =>
    `draft.marks.${classId}.${subjectId}.${examId}`,
  attendance: (classId: string | number, date: string) => `attendance.${classId}.${date}`,
  // Namespaced per user: badge totals must never leak across accounts.
  unreadCounts: (userId: string | number) => `social.${userId}.unreadCounts`,
  jobs: (view: string) => `jobs.${view}`,
  conversations: "chat.conversations",
  messages: (conversationId: string) => `chat.${conversationId}.messages`,
} as const;
