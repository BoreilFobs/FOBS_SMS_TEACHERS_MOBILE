# Future Laravel contracts for the teacher social network

These are proposed backend contracts only. No route below is called by the
mobile app today. All routes require a valid Sanctum/Bearer-authenticated
FobsSMS teacher unless stated otherwise. JSON errors should use:

```json
{ "message": "Human-readable message", "code": "STABLE_CODE", "errors": {} }
```

Use `403` for permission failures, `404` for inaccessible/missing resources,
`409` for state conflicts, `422` for validation, and `429` for rate limits.
Collection responses should use cursor pagination:

```json
{ "data": [], "meta": { "next_cursor": null, "has_more": false } }
```

## Posts and feed

- `GET /api/social/feed?cursor=&limit=20`: authenticated teachers; returns
  `Post[]` plus pagination. The server must exclude blocked relationships and
  return `recommendation_reason` only when applicable.
- `GET /api/social/posts/{post}`: returns one visible `Post`.
- `POST /api/social/posts`: any authenticated teacher. Payload:
  `{type,text,category_id,school_id?,location?,tagged_teacher_ids[],hashtags[],media_ids[],question_title?,poll?}`.
  `type` is `text|image|poll|question`. Validate real school assignment before
  accepting `school_id`, at least two unique poll options, and media ownership.
- `PATCH /api/social/posts/{post}`: author only; same mutable fields, with type
  immutable. Returns the updated `Post` and `edited_at`.
- `DELETE /api/social/posts/{post}`: author or moderator. Return `204`; reshares
  keep a tombstone reference.
- `GET /api/social/teachers/{teacher}/posts?cursor=&kind=posts|reshares`: visible
  profile posts with pagination.

`Post` should include author summary, timestamps, type-specific fields, media,
category, optional public school summary, location, tags, hashtags, reaction
summary/current reaction, comment/reshare counts, saved/reported state, and an
optional original-post summary.

## Post media uploads

- `POST /api/social/media`: multipart `file`, `kind=image`,
  `alt_text?`. Authenticated teacher; validate MIME, dimensions, file size, and
  malware scan. Return `{data:{id,url,thumbnail_url,alt_text,status}}`.
- `DELETE /api/social/media/{media}`: uploader only and only while unattached.
  Return `204`.

Uploads should use short-lived signed direct-upload URLs if object storage is
introduced. Never accept a client-supplied public URL as proof of ownership.

## Reactions

- `PUT /api/social/posts/{post}/reaction`: payload
  `{type:"like|love|support|insightful|celebrate"}`. Upserts the teacher's one
  reaction and returns `{data:{current_reaction,summary}}`.
- `DELETE /api/social/posts/{post}/reaction`: removes the current reaction and
  returns the updated summary.
- `GET /api/social/posts/{post}/reactions?cursor=&type=`: paginated teacher
  summaries. Respect blocked accounts.

## Comments and replies

- `GET /api/social/posts/{post}/comments?cursor=`: paginated root comments,
  each with a bounded first page of replies.
- `GET /api/social/comments/{comment}/replies?cursor=`: paginated replies.
- `POST /api/social/posts/{post}/comments`: payload
  `{text,parent_id?,mention_teacher_ids[]}`. A parent must be a root comment on
  the same post; only one reply level is allowed.
- `DELETE /api/social/comments/{comment}`: author or moderator. If replies
  exist, return a tombstone comment; otherwise return `204`.

Comments cannot be edited. Validate length, mentions, visibility, and block
relationships.

## Poll voting

- `PUT /api/social/posts/{post}/vote`: payload `{option_ids[]}`. Validate one
  option for single-choice polls, at least one for multiple-choice polls, all
  option IDs belonging to the poll, and poll availability. Replace the
  teacher's previous selection atomically. Return the poll with totals and
  percentages.
- `DELETE /api/social/posts/{post}/vote`: removes the current vote if product
  policy permits it.

## Follows and profiles

- `PUT /api/social/teachers/{teacher}/follow` and
  `DELETE /api/social/teachers/{teacher}/follow`: prevent self-follow and block
  conflicts. Return `{data:{following,follows_you,mutual,counts}}`.
- `GET /api/social/teachers/{teacher}/followers?cursor=` and `/following`:
  paginated public teacher summaries.
- `GET /api/social/teachers/{teacher}`: authenticated-only professional public
  profile. Must omit private email, private phone, birth date, address,
  documents, account security, and internal school records.
- `PATCH /api/teacher/professional-profile`: current teacher only. Payload may
  contain headline, biography, city, subject/level IDs, specialization, skills,
  qualifications, certifications, experience, languages, and per-field
  visibility. Return the expanded profile.

Professional document binaries need separate private endpoints and must never
appear in social profile responses.

## Saves and reshares

- `PUT /api/social/posts/{post}/save` and
  `DELETE /api/social/posts/{post}/save`: current teacher only; return saved
  state.
- `GET /api/social/saved-posts?cursor=`: paginated saved posts.
- `POST /api/social/posts/{post}/reshares`: payload `{quote_text?}`. Empty quote
  creates an instant reshare; otherwise a quote post. Return the new post and
  updated original reshare count.
- `DELETE /api/social/reshares/{reshare}`: resharing author only.

## Reports and blocking

- `POST /api/social/reports`: payload
  `{reportable_type:"post|teacher",reportable_id,reason,details?}`. Prevent
  duplicate open reports. Return `202` with `{data:{id,status:"submitted"}}`;
  reporting does not automatically hide content.
- `PUT /api/social/teachers/{teacher}/block`: current teacher only. Atomically
  remove follow edges and revoke conversation eligibility. Return `204`.
- `DELETE /api/social/teachers/{teacher}/block`: return `204`; follow edges are
  not restored.
- `GET /api/social/blocked-teachers?cursor=`: paginated blocked summaries.

## Search

- `GET /api/social/search?q=&type=teachers|posts|jobs|all&cursor=&filters[]`:
  authenticated-only. Require a bounded query, filter blocked accounts, apply
  visibility, and return typed sections or a typed page. Use locale-aware
  French/English indexing. Never expose private teacher fields.

## Conversations and messages

- `GET /api/social/conversations?cursor=`: current teacher's one-to-one
  conversations with unread counts and last-message preview.
- `POST /api/social/conversations`: payload `{teacher_id}`. Both teachers must
  currently follow each other and neither may block the other. Return an
  existing conversation idempotently or create one.
- `GET /api/social/conversations/{conversation}/messages?cursor=`: participant
  only; cursor-paginated newest-first history.
- `POST /api/social/conversations/{conversation}/messages`: participant only,
  mutual-follow relationship still required. Payload:
  `{client_id,type:"text|image|post|job|profile",text?,media_id?,shared_id?}`.
  Validate exactly the fields required by the type and use `client_id` for
  idempotency. Return delivery status and timestamps.
- `PUT /api/social/conversations/{conversation}/read`: payload
  `{through_message_id}`; return unread count and read timestamp.

No group, call, voice-note, disappearing-message, or external-delivery contract
is proposed.

## Jobs

- `GET /api/jobs?cursor=&q=&subject_id=&location=&qualification=&level=&employment_type=&max_experience=&saved=`:
  authenticated teachers; paginated school-published opportunities.
- `GET /api/jobs/{job}`: returns school public summary, subjects, level,
  qualification, experience, employment type, description, responsibilities,
  dates, positions, saved state, and the current teacher's application summary.
- `PUT /api/jobs/{job}/save` and `DELETE /api/jobs/{job}/save`.

Creation/editing is restricted to authorized school administrative interfaces;
the Teacher App must not receive publish permissions. Closed or expired jobs
return `409 JOB_CLOSED` on application.

## Job applications

- `POST /api/jobs/{job}/applications`: payload
  `{motivation,expected_availability,profile_revision}`. Teacher only; validate
  profile completeness and enforce one application per teacher/job. Return
  `201` with status `submitted`.
- `GET /api/teacher/job-applications?cursor=&status=`: the current teacher's
  paginated applications.
- `GET /api/teacher/job-applications/{application}`: owner only.
- `PATCH /api/teacher/job-applications/{application}`: payload
  `{motivation,expected_availability}`; owner only and only while status is
  `submitted`. Return `409 APPLICATION_LOCKED` once `viewed`, `accepted`, or
  `rejected`.

School administrators transition status through their authorized backend.
Allowed statuses are `submitted|viewed|accepted|rejected`; transitions must be
audited and generate notifications.

## Notifications

- `GET /api/notifications?category=social|jobs|school&cursor=`: current teacher
  only, paginated and date-sortable. Return typed destination data rather than
  an unvalidated client URL.
- `PUT /api/notifications/{notification}/read`: owner only.
- `PUT /api/notifications/read`: payload `{category,through_id?}` to mark a
  category as read.
- `GET /api/notifications/unread-counts`: return per-category and message
  counts.

School notifications should adapt the existing school event source rather than
duplicate it. Direct destinations must be authorized again when opened.

## Events, authorization, and consistency

Laravel policies must enforce author/participant/school permissions on every
resource. Recommended events include `PostReacted`, `CommentCreated`,
`FollowBecameMutual`, `MessageCreated`, `ApplicationStatusChanged`, and
`SchoolNotificationCreated`. Queue notification fan-out, use transactions for
counts/relationship transitions, and treat aggregate counts as server-owned.
Use stable opaque IDs, UTC ISO-8601 timestamps, idempotency keys on create/send
operations, and API resource versioning when shapes change.
