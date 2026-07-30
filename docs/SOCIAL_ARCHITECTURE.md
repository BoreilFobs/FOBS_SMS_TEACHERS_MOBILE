# FobsSMS Teacher social architecture

## Runtime boundary

The social UI imports the `SocialSessionRepository` contract through
`social/services/repositories.ts`. The binding is `ApiSocialRepository`, backed
by the real Laravel API. The mock repository and its seeds have been deleted —
see `docs/SOCIAL_API_MIGRATION.md` for the migration and its trade-offs.

`social/store/socialStore.ts` holds the snapshot the screens read; repositories
fetch from the API and write results into it, so `getSnapshot`/`subscribe` behave
as they did under the mock. It is a cache only: server responses always win and
nothing is persisted, so a restart refetches rather than restoring seed data.

Authentication, the current user/teacher, assigned schools, classes, subjects,
attendance, marks, and school dashboard data continue to use their existing
Laravel services, unchanged. The signed-in teacher's social identity is loaded
from `GET /api/teacher/professional-profile`; `social/api/identity.ts` maps their
real id onto the `teacher-current` sentinel the screens compare against.

All three notification categories — including School — now come from
`GET /api/notifications`. The backend serves the School category by projecting
its existing `activities` table read-only, so there is no client-side
school-notification logic. The local updates repository still backs the separate
forum and announcement screens under `app/updates/`, which have no endpoints.

## Deterministic feed ranking

Ranking is now performed **server-side**, using the same formula documented below
so ordering did not change when the mock was replaced. Blocked authors are removed
before scoring. Posts are sorted using:

1. current teacher's own posts: 12,000 points;
2. followed authors: 10,000 points;
3. a category matching one of the current teacher's subjects: 2,000 points;
4. professional questions: 300 points;
5. recency: up to 1,200 points, decreasing by eight points per hour;
6. engagement: reactions + (comments × 2) + (reshares × 3).

Timestamp and ID are stable tie-breakers. Pagination uses an integer offset
cursor. This is a transparent mock ranking, not an AI recommendation claim.

## Data sources

| Capability | Source |
| --- | --- |
| Authentication/logout | Existing Laravel API |
| Current account and existing teacher profile | Existing Laravel API/local authenticated store |
| Assigned schools and last-selected school | Existing Laravel API + existing persisted school store |
| School dashboard, classes, subjects, attendance, marks, reports | Existing Laravel API |
| Social feed, posts, reactions, comments, polls | Laravel API (`/api/social/*`) |
| Follows, saves, reshares, reports, blocking, search | Laravel API (`/api/social/*`) |
| Conversations and messages | Laravel API (`/api/social/conversations*`) |
| Jobs and applications | Laravel API (`/api/jobs*`, `/api/teacher/job-applications`) |
| Social/job/school notifications | Laravel API (`/api/notifications`) |
| Social professional fields (headline, city, biography, skills, languages, levels) | Laravel API (`/api/teacher/professional-profile`) |
| Professional record arrays (qualifications, certifications, experiences, documents) | Local repository — no endpoints exist yet |
| Forum and school announcement screens | Local updates repository — no endpoints exist yet |

## Failures and latency

There are no artificial delays and no failure-injection switch; both were mock
affordances and are gone. Real latency, timeouts, retries and offline detection are
handled by `social/api/client.ts`, with every timing value in
`social/constants/network.ts`.

## Real-time

Still REST plus polling — the backend has no broadcasting layer. Intervals and the
exact steps to swap polling for push are documented in
`docs/SOCIAL_API_MIGRATION.md`.
