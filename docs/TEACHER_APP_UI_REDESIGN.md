# FobsSMS Teacher app UI/UX redesign

## Repository audit

The application is an Expo SDK 57 / React Native 0.86 project using React 19,
TypeScript strict mode, Expo Router, Zustand, AsyncStorage, Axios/fetch, and
English/French localization.

### Original navigation

- `app/index.tsx`: authenticated school selection and first active-school setup
- `(tabs)/home`: live school dashboard
- `(tabs)/subjects` → `marks/classes` → `marks/exams` → `marks/students`
- `(tabs)/attendance` → `attendance/students`
- `(tabs)/profile`: account/profile menu
- `auth`, `setup`, school request, reports, settings, password, and support routes

Authentication is token-based. `AuthWrapper` checks `auth_token`; `SetupWrapper`
checks the stored teacher record. The selected school is persisted in a Zustand
store and the user/teacher records are loaded from AsyncStorage.

### Existing Laravel-connected functionality

The redesign retains the existing request and response structures for:

- `POST /login`, `/register`, `/logout`, `/auth/google`
- password recovery and password change endpoints
- `POST /teacher/setup`
- `POST /teacher/update-profile`
- `GET /teacher-schools?teacher_id=`
- school request endpoints
- `GET /teacher/dashboard?school_id=&teacher_id=`
- `GET /school-classes?school_id=`
- `GET /teacher-subjects?school_id=&teacher_id=`
- `GET /teacher-classes?school_id=&teacher_id=&subject_id=`
- `GET /exam-sequences?school_id=`
- `GET /class-students?class_id=`
- `GET/POST /attendances`
- `GET/POST/DELETE /marks`
- `GET /teacher/performance-report`

No timetable or question-paper functionality was present or added.

## Problems found

- Primary navigation exposed separate marks and attendance destinations instead
  of grouping daily class work.
- School context was visually inconsistent between screens, and some child
  screens read the currently selected school instead of preserving the school
  used to open the flow.
- Design decisions were repeated per screen with many hardcoded colors,
  blur/gradient layers, arbitrary spacing, and inconsistent touch targets.
- A manual theme provider existed but was not mounted; most screens only followed
  the system theme.
- Two API clients coexisted, while many screens called `fetch` directly.
- Loading and empty states varied significantly; live dashboard failures were
  mostly logged instead of explained.
- Attendance required opening a session and marking every learner individually
  with no fast “remaining present” action.
- Marks required a modal and a request for every individual edit, making
  keyboard-heavy entry slow.
- Notifications were a “coming soon” alert.
- The basic teacher record mixed professional and private data and did not offer
  a safe authenticated shared-profile view.
- Strict type checking had pre-existing failures in setup, OTP refs, and profile
  store methods.

## New information architecture

The primary tabs are now:

1. **Home** — current context, live school summary, priority actions, and compact
   previews.
2. **Classes** — attendance and marks entry plus live assigned classes/subjects.
3. **Updates** — distinct Forum, My Schools, and Notifications tabs.
4. **Profile** — professional overview, official assignments, account settings,
   shared-profile preview, and sectioned profile management.

Legacy marks and attendance tab routes remain available as hidden task routes so
existing navigation and endpoint behavior are preserved.

## Screens redesigned or added

- Login, registration, WhatsApp OTP password reset, and teacher onboarding
- Action-oriented Home dashboard
- Combined Classes workspace and school-aware school selector
- Attendance class selection and student attendance
- Marks subject, class, sequence, and inline student entry
- Profile overview, authenticated shared profile, and sectioned profile editor
- Settings with English/French and system/light/dark preferences
- Forum feed and post details
- School-announcement feed and details
- Notification centre with filters, grouping, unread actions, and deep links

## Design system

`constants/theme.ts` defines semantic light/dark colors, spacing, typography,
radii, elevation, icon sizing, touch targets, and motion durations. The mounted
theme provider preserves `light`, `dark`, and `system` preferences.

Shared UI primitives live in `components/ui/index.tsx`:

- screen and app header
- school selector
- card and section header
- status/filter chips
- search and form fields
- loading, empty, and error states
- primary/secondary/destructive buttons
- offline/synchronization banner

Feature cards live in `components/updates/Cards.tsx`.

## School safety

- The active school remains persisted and is only changed by an explicit school
  selection.
- Marks and attendance child routes receive and retain the originating
  `school_id`.
- Every school announcement carries a school name/acronym.
- Announcement feeds can show all assigned schools or one school.
- Empty assignment states explicitly name the current school context.

## Mock-backed features

The following features are deliberately isolated from production API code:

- forum posts and local bookmarks/read state
- school announcements and read state
- notifications and read state
- expanded professional profile fields and visibility settings

Files:

- `models/updates.ts`
- `models/professionalProfile.ts`
- `services/mock/mockData.ts`
- `services/mock/repositories.ts`
- `contexts/UpdatesContext.tsx`
- `contexts/ProfessionalProfileContext.tsx`

Mock repositories use AsyncStorage through typed interfaces. A future Laravel
implementation can replace the exported repository instances without changing
screens.

## Privacy

The shared professional profile is behind `AuthWrapper`. It may show explicitly
approved professional contact details and current schools, but never shows date
of birth, private address, private email/phone, identity data, certificate files,
account security details, or internal school information. Document handling in
the mock phase records private metadata only and never claims an upload occurred.

## Attendance and marks

Attendance continues using the existing `GET/POST /attendances` contract. The
redesign adds clear context, assigned-subject selection, accessible present/
absent controls, completion summaries, corrections, bulk marking of remaining
learners as present, and per-write synchronization feedback.

Marks continue using the existing `GET/POST/DELETE /marks` contract and the
server’s `mark_entry_allowed` sequence permission. The redesign adds inline
decimal entry, immediate 0–20 validation, missing/saved/draft labels, batched
saving over the existing individual endpoint, and unsaved-change protection.

## Current limitations

- Expanded profile data, forum, announcements, and notifications remain
  device-local until the contracts in `FUTURE_LARAVEL_API_CONTRACTS.md` exist.
- Mock attachment rows are metadata/preview affordances; they do not download or
  upload real files.
- Date fields use validated ISO text input because the project has no native date
  picker dependency.
- Offline detection is represented at the UI boundary, but automatic network
  reachability requires a future connectivity service.
- Older support, reports, and school-request screens still contain parts of their
  previous visual implementation; authentication and the primary daily teacher
  journeys use the new design system.
