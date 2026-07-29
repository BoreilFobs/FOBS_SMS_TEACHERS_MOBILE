# Future Laravel API contracts

These endpoints do not exist in the current backend. They are the replacement
boundary for the typed repositories in `services/mock/repositories.ts`.
All routes require an authenticated FobsSMS user. Laravel policies must enforce
school membership and field visibility.

## Common response and pagination

Successful list:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 0
  }
}
```

Validation errors should use HTTP 422 and Laravel’s standard `message` and
`errors` object. Unauthorized records should return 403, not a filtered private
record.

## Forum

### `GET /forum/posts`

Query parameters:

- `search`
- `category`
- `featured`
- `bookmarked`
- `unread`
- `page`

Forum post:

```json
{
  "id": "uuid",
  "title": "Five-minute checks that improve formative assessment",
  "excerpt": "Short summary",
  "content": ["Paragraph one", "Paragraph two"],
  "category": { "id": "uuid", "name": "Assessment" },
  "author": {
    "id": "uuid",
    "name": "Dr Clarisse Mbe",
    "headline": "Assessment and curriculum specialist",
    "verified": true
  },
  "published_at": "2026-07-27T08:30:00Z",
  "reading_minutes": 4,
  "featured": true,
  "pinned": true,
  "is_read": false,
  "is_bookmarked": false,
  "cover_image_url": "https://...",
  "attachments": [
    {
      "id": "uuid",
      "title": "Exit-ticket planning guide",
      "kind": "pdf",
      "size_bytes": 430080,
      "download_url": "https://..."
    }
  ],
  "permissions": {
    "publish": false,
    "comment": false,
    "react": false,
    "report": false,
    "bookmark": true
  }
}
```

### `GET /forum/posts/{post}`

Returns the full post plus `related_posts`.

### `POST /forum/posts/{post}/read`

Idempotently records the authenticated user’s read state.

### `PUT /forum/posts/{post}/bookmark`
### `DELETE /forum/posts/{post}/bookmark`

The current teacher phase should expose bookmark permission only. Do not expose
publish/comment/reaction actions until policies and endpoints are enabled.

## School announcements

### `GET /teacher/announcements`

Query parameters: `school_id`, `search`, `priority`, `unread`, `page`.
`school_id` may be omitted to return announcements from all assigned schools.

```json
{
  "id": "uuid",
  "school": {
    "id": 42,
    "name": "Government Bilingual High School",
    "acronym": "GBHS"
  },
  "title": "Sequence results review window",
  "excerpt": "Teachers should verify entered marks.",
  "message": ["Paragraph one", "Paragraph two"],
  "publisher": {
    "id": 8,
    "name": "Academic Office",
    "role": "school_administrator"
  },
  "published_at": "2026-07-28T07:20:00Z",
  "priority": "important",
  "pinned": true,
  "is_read": false,
  "attachments": []
}
```

Teacher policies must be read-only. Creation, update, and deletion endpoints must
not be advertised to the teacher client.

### `GET /teacher/announcements/{announcement}`

Must return 403 unless the teacher is assigned to the publishing school.

### `POST /teacher/announcements/{announcement}/read`

Idempotently marks the announcement read for the authenticated teacher.

## Notifications

### `GET /teacher/notifications`

Query parameters: `unread`, `category`, `page`.

```json
{
  "id": "uuid",
  "category": "marks",
  "title": "Marks entry is open",
  "body": "Complete the current sequence.",
  "created_at": "2026-07-27T15:10:00Z",
  "read_at": null,
  "school": {
    "id": 42,
    "name": "Government Bilingual High School"
  },
  "target": {
    "type": "marks_sequence",
    "school_id": 42,
    "subject_id": 9,
    "class_id": 18,
    "sequence_id": 3
  }
}
```

The client should map typed targets to local routes. The server must not return
arbitrary URLs as trusted deep links.

### `POST /teacher/notifications/{notification}/read`
### `POST /teacher/notifications/read-all`

Both operations should be idempotent. `read-all` accepts an optional category.

## Professional profile

### `GET /teacher/professional-profile`
### `PUT /teacher/professional-profile`

The private owner response includes all editable professional data and visibility
settings. It must not combine account security or identity-document fields.

Top-level update:

```json
{
  "headline": "Secondary-school educator",
  "city": "Douala",
  "biography": "Professional biography",
  "primary_field_id": 12,
  "additional_field_ids": [18],
  "subject_ids": [4, 7],
  "level_ids": [2, 3],
  "expertise": ["Formative assessment"],
  "teaching_language_ids": [1, 2],
  "skill_ids": [6, 9],
  "professional_email": "teacher@example.org",
  "professional_phone": "+237...",
  "visibility": {
    "professional_email": false,
    "professional_phone": false,
    "current_schools": true
  }
}
```

System-controlled fields, subjects, levels, languages, and skills should have
separate option endpoints or be included in a profile-form schema endpoint.

### Repeated record endpoints

- `GET/POST /teacher/professional-profile/qualifications`
- `PUT/DELETE /teacher/professional-profile/qualifications/{qualification}`
- `GET/POST /teacher/professional-profile/certifications`
- `PUT/DELETE /teacher/professional-profile/certifications/{certification}`
- `GET/POST /teacher/professional-profile/experiences`
- `PUT/DELETE /teacher/professional-profile/experiences/{experience}`
- `GET/POST /teacher/professional-profile/languages`
- `PUT/DELETE /teacher/professional-profile/languages/{language}`

Use the fields represented by `models/professionalProfile.ts`. Dates should be
ISO `YYYY-MM-DD`; arrays of subjects/levels should use IDs where master data
exists.

### `GET /users/{user}/professional-profile`

Authenticated shared-profile response. The server must apply visibility policy
and omit, rather than null-fill, private fields. Never include:

- date of birth or private address
- private phone/account email
- identity or certificate file URLs
- account security information
- internal school assignment metadata

### Documents

- `GET /teacher/professional-profile/documents`
- `POST /teacher/professional-profile/documents`
- `DELETE /teacher/professional-profile/documents/{document}`

Use private object storage, signed short-lived download URLs, MIME/size
validation, malware scanning, and an explicit verification state. A successful
metadata request must not imply that a binary upload succeeded.

## Synchronization and errors

Repositories should expose:

- loading, empty, populated, error, and offline states
- last synchronized timestamp
- retryable vs validation/permission errors
- optimistic read/bookmark changes with rollback

ETags or `updated_since` cursors are recommended for announcements and
notifications. All mutation endpoints should accept an idempotency key.

