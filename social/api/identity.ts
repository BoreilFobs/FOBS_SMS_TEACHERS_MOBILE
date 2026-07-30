import { CURRENT_TEACHER_ID } from "@/social/models";

/**
 * Translation between the app's "me" sentinel and the real teacher id.
 *
 * Phase 1 shipped `CURRENT_TEACHER_ID = "teacher-current"` and ten screens
 * compare against it (`post.authorId === CURRENT_TEACHER_ID`,
 * `snapshot.teachers.find(t => t.id === CURRENT_TEACHER_ID)`, and the
 * `/social/profile/[id]` route param). The real backend uses numeric ids.
 *
 * Rather than edit those ten screens, the sentinel is preserved and this module
 * translates at the API boundary in both directions:
 *
 *   inbound  — any id equal to the session teacher's real id becomes the sentinel
 *   outbound — the sentinel becomes the real id before it reaches a URL or body
 *
 * The mapping is driven by the server's own `is_self` flag on TeacherResource,
 * so it is authoritative rather than inferred. This is the single non-obvious
 * adaptation in the migration and it lives in exactly one file.
 */

let realCurrentTeacherId: string | null = null;

/** Called once the session's own profile is known. */
export function setCurrentTeacherId(id: string | null): void {
  realCurrentTeacherId = id === null ? null : String(id);
}

export function getCurrentTeacherId(): string | null {
  return realCurrentTeacherId;
}

/** Real id (or sentinel) → the id screens expect. */
export function toLocalId(id: string | null | undefined): string {
  if (id === null || id === undefined) return "";
  const value = String(id);
  return realCurrentTeacherId !== null && value === realCurrentTeacherId
    ? CURRENT_TEACHER_ID
    : value;
}

/** Screen-facing id (possibly the sentinel) → the id the API expects. */
export function toRemoteId(id: string): string {
  if (id === CURRENT_TEACHER_ID) {
    if (realCurrentTeacherId === null) {
      throw new Error("SOCIAL_IDENTITY_UNRESOLVED");
    }
    return realCurrentTeacherId;
  }
  return String(id);
}

export function isCurrentTeacher(id: string | null | undefined): boolean {
  if (id === null || id === undefined) return false;
  const value = String(id);
  return value === CURRENT_TEACHER_ID || value === realCurrentTeacherId;
}
