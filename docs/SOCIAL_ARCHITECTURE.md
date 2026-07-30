# FobsSMS Teacher social architecture

## Runtime boundary

The social UI imports the `SocialSessionRepository` contract through
`social/services/repositories.ts`. The current binding is
`InMemorySocialRepository`. It is created once when the JavaScript process
starts, emits updates to `SocialProvider`, and is never written to
AsyncStorage. A process restart therefore restores `social/mock/seeds/index.ts`.

Authentication, the current user/teacher, assigned schools, classes, subjects,
attendance, marks, and school dashboard data continue to use their existing
Laravel services. `SocialProvider` overlays only the real teacher's name,
photo, biography, qualification, specialization, experience, and real assigned
school names onto the session's `teacher-current` social identity.

The existing administrative update source is adapted into the School tab of
the unified notification screen. Source inspection found no Laravel
announcement or administrative-notification endpoint in this mobile project,
so the existing local update repository remains clearly separate from real
school endpoints.

## Deterministic feed ranking

Blocked authors are removed before scoring. Remaining posts are sorted using:

1. current teacher's own posts: 12,000 points;
2. followed authors: 10,000 points;
3. a category matching one of the current teacher's subjects: 2,000 points;
4. professional questions: 300 points;
5. recency: up to 1,200 points, decreasing by eight points per hour;
6. engagement: reactions + (comments × 2) + (reshares × 3).

Timestamp and ID are stable tie-breakers. Pagination uses an integer offset
cursor. This is a transparent mock ranking, not an AI recommendation claim.

## Real and mock mapping

| Capability | Source |
| --- | --- |
| Authentication/logout | Existing Laravel API |
| Current account and existing teacher profile | Existing Laravel API/local authenticated store |
| Assigned schools and last-selected school | Existing Laravel API + existing persisted school store |
| School dashboard, classes, subjects, attendance, marks, reports | Existing Laravel API |
| Existing school updates | Existing local updates repository; no endpoint was found |
| Social feed, posts, reactions, comments, polls | In-memory social repository |
| Follows, saves, reshares, reports, blocking, search | In-memory social repository |
| Conversations and messages | In-memory social repository |
| Jobs and applications | In-memory social repository |
| Social/job notifications | In-memory social repository |
| New professional-only fields | Existing professional mock repository/social seed |

## Controlled failures and delays

Repository calls use a fixed 140 ms delay. Tests or development tooling can
call `setFailureMode(true)` to produce the stable
`SOCIAL_MOCK_UNAVAILABLE` error; no random failures are used. Message sends are
optimistic and roll back if controlled failure mode is active.

## Backend replacement

Implement `SocialSessionRepository` with HTTP-backed subrepositories, bind the
implementation in `social/services/repositories.ts`, then replace the snapshot
subscription with query-cache invalidation or server events. Screens and
components do not import seed arrays.
