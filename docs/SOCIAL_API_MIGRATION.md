# Social API migration (mock → real backend)

The professional network now talks to the real Laravel API. The in-memory mock
repository and its seed data have been deleted; there is no mock-vs-real toggle.

## Layout

```
social/api/
  client.ts          HTTP client: timeouts, retry, {message,code,errors}, offline, 401
  errors.ts          SocialApiError + kind classification
  describeError.ts   Which message to show a teacher for a failed action
  dto.ts             Wire types, mirroring the Laravel API Resources
  mappers.ts         DTO → the phase 1 domain models (the only translation layer)
  identity.ts        CURRENT_TEACHER_ID sentinel ⇄ real teacher id
  media.ts           Multipart upload for post images and photos
  mediaRegistry.ts   URL → media-id lookup, so editing keeps existing images
social/store/
  socialStore.ts     Observable snapshot cache the screens read
social/repositories/api/
  ApiSocialRepository.ts   Facade implementing SocialSessionRepository
  PostsApiRepository.ts    Feed, posts, reactions, saves, reshares, votes
  CommentsApiRepository.ts Comments and replies
  NetworkApiRepository.ts  Follows, discovery, profiles, blocks, reports
  MessagingApiRepository.ts Conversations and messages
  JobsApiRepository.ts     Jobs and applications
  NotificationsApiRepository.ts All three categories
  SearchApiRepository.ts   Cross-entity search
social/constants/network.ts  Every timeout and polling interval
social/hooks/                usePolling, useSocialResource, useFeed, useSocial
social/contract/             Live-backend contract suite (see below)
```

## Why the snapshot survived

`useSocial()` exposes a **synchronous** `getSnapshot(): SocialSnapshot` through
`useSyncExternalStore`, and fourteen screens plus two components read
`snapshot.posts` / `.teachers` / `.comments` / `.conversations` /
`.notifications` / `.jobs` / `.applications` directly. The mock was both the data
source *and* the store.

A network repository cannot answer synchronously, so `social/store/socialStore.ts`
took over the store half: repositories fetch, then write results into it, and
`getSnapshot`/`subscribe` behave exactly as before. **That is why all fourteen
screens and the eight repository interfaces are unchanged.** It is a cache, never a
source of truth — server responses always overwrite it, and nothing is persisted.

## The one interface change

`SocialSessionRepository.setFailureMode(enabled)` was removed. It existed only to
make the mock throw on demand and had no call sites outside the mock. Real failures
now come from the network. The eight feature interfaces
(`SocialFeedRepository` … `ModerationRepository`) are untouched.

## The CURRENT_TEACHER_ID sentinel

Phase 1 shipped `CURRENT_TEACHER_ID = "teacher-current"`, and ten screens compare
against it. The backend uses numeric ids. Rather than edit those screens,
`social/api/identity.ts` translates at the API boundary in both directions —
inbound, any id matching the session teacher becomes the sentinel; outbound, the
sentinel becomes the real id. The mapping is driven by the server's own `is_self`
flag, so it is authoritative rather than guessed. This is the only non-obvious
adaptation in the migration and it lives in one file.

## Pagination

Every list endpoint returns `{data, meta:{next_cursor, has_more}}`; `next_cursor`
is an opaque string and `null` on the last page (mapped to `undefined` for the
`FeedPage` contract).

| List | Handling |
| --- | --- |
| Feed | Cursor kept in `useFeed`; `loadMore` appends ids, de-duplicated. Order is the server's ranking; bodies are read live from the store so a reaction elsewhere updates the card without reshuffling |
| Comments | First page of roots, each with a bounded page of inlined replies, flattened to the `Comment[]` the contract returns. `loadReplies` fetches the rest |
| Teachers / followers / following / blocked / suggested / trending | First page cached; the contract has no cursor parameter, so deeper pages need a future contract change |
| Jobs | Filters are applied **server-side** — the mock filtered an in-memory list, which would only ever filter the loaded page |
| Applications | Paged, with per-status counts in `meta.counts` |
| Conversations | Paged and **searched server-side**; the local name filter is only instant feedback while a debounced request is in flight |
| Messages | Paged newest-first per conversation, merged into the cached thread by id |
| Notifications | Paged per category. An uncategorised request returns the stored categories only — `school` paginates against a different table, so mixing them into one offset cursor produces unstable pages |

## Image upload

Two-step, as the backend requires: `POST /social/media` first, then reference the
returned ids as `media_ids[]` when creating or editing the post. That is what lets
the server verify the uploader owns each image instead of trusting a
client-supplied URL.

- Field name `file`; `alt_text` optional (255 chars).
- Accepts jpeg, jpg, png, gif, webp, heic, heif. **svg is rejected** by the server.
- Max 8 MB, validated locally first so a doomed upload never leaves the device.
- Progress is reported via `XMLHttpRequest` (React Native's `fetch` cannot report
  upload progress).
- Uploads run **sequentially** — parallel multipart uploads on a mobile connection
  tend to slow each other down and time out together.
- Partial failure is surfaced, never swallowed: publishing throws with the real
  reason so the composer can offer a retry rather than dropping an image.
- Cancellation aborts the request; `discardUpload` deletes an unattached upload.
- Once attached, rendering uses the **server URL**; the local `file://` URI is
  dropped. `mediaRegistry.ts` remembers URL → id so an edit that keeps an image
  re-sends its id instead of re-uploading.
- `expo-image-picker` is reused; no new dependency was added.

## Polling (no real-time yet)

The backend is REST-only — no broadcasting is configured. All intervals live in
`social/constants/network.ts`; there are no magic numbers in screens.

| Surface | Interval | Behaviour |
| --- | --- | --- |
| Open conversation | `openConversationMs` = 7 s | Focused-only; pauses on blur and on app background; marks read while open |
| Conversation list | `conversationListMs` = 45 s | Plus refresh on focus |
| Notifications list | `notificationsMs` = 45 s | Plus refresh on focus |
| Unread badges | `notificationsMs` = 45 s | Plus refresh on app foreground, from `/notifications/unread-counts` |
| Feed | **not polled** | Pull-to-refresh and focus, throttled by `feedFocusThrottleMs` = 30 s — re-ordering a list someone is scrolling is hostile |

`usePolling` clears its timer on blur and unmount, skips a tick while the previous
request is still in flight, and swallows poll errors (the next tick retries; the
screen's own fetch surfaces real failures).

**To replace with push:** subscribe to the private conversation and teacher
channels the backend's `App\Events\Social\*` events are ready for, then delete the
`usePolling` calls in `app/social/conversation/[id].tsx`,
`app/social/conversations.tsx` and `app/social/notifications/index.tsx`, and the
interval in `SocialProvider`. Nothing else changes.

## Business-rule errors surfaced

The server already localises its messages and states which rule was broken, so
`describeSocialError` prefers the server's text and the UI branches on the stable
`code`. The mock signalled rules through `Error.message`, so every such comparison
was rewritten.

| Rule | Code | Where |
| --- | --- | --- |
| Duplicate report | `ALREADY_REPORTED` | Report action |
| Duplicate application | `ALREADY_APPLIED` | Job detail |
| Closed posting | `JOB_CLOSED` | Job detail |
| Application locked once viewed | `APPLICATION_LOCKED` | Applications edit modal |
| Messaging without mutual follow | `MUTUAL_FOLLOW_REQUIRED` | Conversation + composer disabled |
| Block conflict | `BLOCK_CONFLICT` | Follow, messaging |
| Self-follow / self-block | `CANNOT_FOLLOW_SELF`, `CANNOT_BLOCK_SELF` | Network |
| Poll rules | `POLL_SINGLE_CHOICE`, `INVALID_POLL_SELECTION` | Poll voting |
| Reply depth | `REPLY_DEPTH_EXCEEDED`, `INVALID_REPLY_TARGET` | Comments |
| Media | `MEDIA_NOT_AVAILABLE`, `MEDIA_ALREADY_ATTACHED` | Compose |
| Unassigned school | `SCHOOL_NOT_ASSIGNED` | Compose |
| Profile incomplete | `TEACHER_PROFILE_REQUIRED` | Any social call |

Client-side re-implementations of server rules were removed. Poll duplicate-vote
logic, mutual-follow checks and edit-locks are now server decisions; the client
keeps only immediate UX guards (a disabled composer, a locked edit button).

## Optimistic updates kept

Only where a server response can reconcile them:

- **Reactions** — toggles instantly, then overwrites with the server's summary;
  rolls back the previous state on failure.
- **Saves** (posts and jobs) — same pattern.
- **Messages** — an optimistic bubble with `status: "sending"`, replaced by the
  server's message or removed on failure. A `client_id` makes the send idempotent,
  so a retry after a lost response returns the original instead of duplicating.
- **Notification read state** — flipped locally, then re-read on failure.

Counters that the server owns (follower counts, comment counts, poll totals) are
**not** guessed locally — they are refetched, because a diverged counter is worse
than a brief delay.

## Authentication

No parallel auth path. `social/api/client.ts` is built on the app's existing
`services/authFetch.ts`, so token attachment stays in one place, identical to how
attendance, marks and schools already work. A 401 calls
`utils/auth.ts#handleSessionExpired`, which reuses the app's real sign-out teardown
without a confirmation prompt (there is nothing to confirm once the token is
invalid) and is guarded so concurrent 401s redirect once.

## Contract suite (live backend)

`social/contract/` runs the real repositories against a running Laravel instance.
This is what makes "verified against the backend" true rather than aspirational — a
typecheck cannot catch a renamed field or a rule that fires differently than
assumed.

```bash
# 1. Serve the backend against a scratch database
cd FOBS_SMS_API_WEB
php artisan serve --env=local --host=127.0.0.1 --port=8099

# 2. Point the suite at it and run
cd FOBS_SMS_TEACHERS_MOBILE
SOCIAL_CONTRACT_BASE_URL=http://127.0.0.1:8099/api \
SOCIAL_CONTRACT_TOKEN='<sanctum token>' \
SOCIAL_CONTRACT_MUTUAL_ID=2 SOCIAL_CONTRACT_ONEWAY_ID=3 \
SOCIAL_CONTRACT_STRANGER_ID=4 SOCIAL_CONTRACT_THEIR_POST_ID=2 \
SOCIAL_CONTRACT_POLL_POST_ID=4 SOCIAL_CONTRACT_MULTI_POLL_POST_ID=5 \
SOCIAL_CONTRACT_OPEN_JOB_ID=1 SOCIAL_CONTRACT_CLOSED_JOB_ID=3 \
SOCIAL_CONTRACT_PENDING_JOB_ID=4 \
npm run test:contract
```

It **skips entirely** when those variables are absent, so `npm test` stays
hermetic. It writes to the backend and asserts one-shot rules, so it needs a
**freshly seeded database each run**.

`social/__tests__/client.test.ts` covers failure classification hermetically
(offline, timeout, 401/409/422 mapping, retry policy) with no backend needed.

## Known limitations

1. **`schoolAffiliation` is not sent on publish.** The domain model carries a
   school *name*; the API needs an id and validates assignment. Resolving names to
   ids needs an endpoint phase 2 did not build, so the field is omitted rather than
   guessed. Existing posts still display their school.
2. **Teacher lists are first-page only.** `NetworkRepository.getTeachers()` returns
   `SocialTeacher[]` with no cursor, so deeper pages need a contract change.
3. **Offline detection is inferred from transport failures**, not from NetInfo — it
   is not a dependency and adding one was out of scope. A request must fail before
   the app knows it is offline.
4. **The professional profile is partially migrated.** `headline`, `city`,
   `biography`, `skills`, `languages`, `certifications` and `educational_levels` are
   server-backed. The rich *record* arrays in `models/professionalProfile.ts`
   (qualifications, certifications, experiences, languages, documents) have no
   endpoints — phase 2 deferred them — so `ProfessionalProfileContext` still uses
   its local repository for those sections.
5. **The forum and school-announcement screens** (`app/updates/*`) still use
   `services/mock/`. Phase 2 built no forum endpoints, and school events are only
   exposed through the notifications adapter, which the notifications screen now
   uses. Out of scope here.
6. **Profile photo upload** goes through the pre-existing
   `POST /teacher/update-profile` multipart endpoint, unchanged. Only *post* images
   use the new two-step media flow.
7. **No UI-level manual pass was possible in this environment** (no simulator).
   Verification was TypeScript, lint, the hermetic unit suite, and the 26-test live
   contract suite covering the data layer end to end.
