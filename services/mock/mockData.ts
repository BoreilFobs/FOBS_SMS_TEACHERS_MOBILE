import type { ProfessionalProfile } from "@/models/professionalProfile";
import type {
  ForumPermissions,
  ForumPost,
  SchoolAnnouncement,
  TeacherNotification,
} from "@/models/updates";

// Centralized development records for features awaiting Laravel endpoints.
// UI files must consume these records only through repository interfaces.
export const forumPermissions: ForumPermissions = {
  canPublish: false,
  canComment: false,
  canReact: false,
  canReport: false,
  canBookmarkLocally: true,
};

export const forumPosts: ForumPost[] = [
  {
    id: "forum-formative-assessment",
    title: "Five-minute checks that improve formative assessment",
    excerpt:
      "Practical exit-ticket patterns teachers can use to spot misconceptions before the next lesson.",
    content: [
      "Short checks are most useful when they answer one clear question: what should I reteach, extend, or group differently tomorrow?",
      "Ask every learner to respond to the same focused prompt. A useful prompt tests the lesson objective rather than recalling a definition. Sort responses into secure, developing, and not-yet-secure groups after class.",
      "Keep the routine predictable. One question, three minutes to answer, and two minutes for learners to compare reasoning gives better evidence than a long worksheet that cannot be reviewed in time.",
      "Use the evidence at the start of the next lesson. Learners notice when their responses change the teaching plan, which makes future checks more thoughtful and honest.",
    ],
    category: "Assessment",
    author: {
      id: "author-mbe",
      name: "Dr Clarisse Mbe",
      headline: "Assessment and curriculum specialist",
      verified: true,
    },
    publishedAt: "2026-07-27T08:30:00.000Z",
    readingMinutes: 4,
    featured: true,
    pinned: true,
    isRead: false,
    isBookmarked: false,
    coverImage:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    attachments: [
      {
        id: "att-exit-ticket",
        title: "Exit-ticket planning guide",
        kind: "pdf",
        size: "420 KB",
      },
    ],
    relatedPostIds: ["forum-inclusive-participation"],
  },
  {
    id: "forum-inclusive-participation",
    title: "Making whole-class participation more inclusive",
    excerpt:
      "Small changes to wait time, response formats, and grouping can give more learners a meaningful voice.",
    content: [
      "Participation is broader than answering aloud. Learners can demonstrate thinking through a written response, a diagram, a worked example, or a carefully chosen question.",
      "Build in silent thinking time before selecting respondents. This reduces the advantage of speed and gives multilingual learners time to formulate a complete answer.",
      "Track whose ideas are heard over a week, not only who raises a hand in one lesson. Use the pattern to vary pairs, prompts, and response formats.",
    ],
    category: "Inclusive education",
    author: {
      id: "author-njoh",
      name: "Esther Njoh",
      headline: "Inclusive education practitioner",
      verified: true,
    },
    publishedAt: "2026-07-25T13:00:00.000Z",
    readingMinutes: 3,
    featured: false,
    pinned: false,
    isRead: true,
    isBookmarked: false,
    attachments: [],
    relatedPostIds: ["forum-formative-assessment"],
  },
  {
    id: "forum-digital-routines",
    title: "A simple routine for evaluating digital learning tools",
    excerpt:
      "Choose tools by learning purpose, access, evidence, and workload—not novelty.",
    content: [
      "Begin with the learning barrier you want to remove. A tool should make feedback faster, representation clearer, practice more focused, or collaboration more effective.",
      "Check whether every learner can access the activity under realistic connectivity and device conditions. Always plan a low-bandwidth equivalent.",
      "Review what evidence the tool gives you and how much teacher time it requires. A sustainable routine is more valuable than a feature-rich tool used once.",
    ],
    category: "Digital learning",
    author: {
      id: "author-fobs",
      name: "FobsSMS Academic Team",
      headline: "Verified publishing source",
      verified: true,
    },
    publishedAt: "2026-07-22T09:15:00.000Z",
    readingMinutes: 3,
    featured: false,
    pinned: false,
    isRead: false,
    isBookmarked: false,
    attachments: [
      {
        id: "att-tool-checklist",
        title: "Digital tool evaluation checklist",
        kind: "document",
        size: "180 KB",
      },
    ],
    relatedPostIds: [],
  },
];

export const announcements: SchoolAnnouncement[] = [
  {
    id: "announcement-results-review",
    schoolId: 1,
    schoolName: "Current school",
    schoolAcronym: "SCH",
    title: "Sequence results review window",
    excerpt:
      "Teachers should verify entered marks and report inconsistencies before Friday at 16:00.",
    message: [
      "The review window for the current sequence is now open. Please verify that every assigned class has a complete set of marks.",
      "Use the marks screen to correct entries that are still open. If an approved marksheet requires a change, contact the school administrator with the class, subject, sequence, and learner details.",
      "The review window closes Friday at 16:00. Marksheets with missing entries will be returned to the responsible teacher.",
    ],
    publisher: "Academic Office",
    publisherRole: "School administrator",
    publishedAt: "2026-07-28T07:20:00.000Z",
    priority: "important",
    pinned: true,
    isRead: false,
    attachments: [
      {
        id: "ann-calendar",
        title: "Results review calendar",
        kind: "pdf",
        size: "310 KB",
      },
    ],
  },
  {
    id: "announcement-parent-meeting",
    schoolId: 2,
    schoolName: "Second school",
    schoolAcronym: "SCH2",
    title: "Preparation for the parent–teacher meeting",
    excerpt:
      "Please prepare concise learner progress notes before the meeting next week.",
    message: [
      "The next parent–teacher meeting will focus on learner progress, attendance patterns, and practical support actions.",
      "Teachers are asked to prepare concise notes for their assigned classes. Keep comments evidence-based and avoid including private information that is not relevant to learning support.",
    ],
    publisher: "School Administration",
    publisherRole: "School administrator",
    publishedAt: "2026-07-26T14:10:00.000Z",
    priority: "normal",
    pinned: false,
    isRead: true,
    attachments: [],
  },
  {
    id: "announcement-safeguarding",
    schoolId: 1,
    schoolName: "Current school",
    schoolAcronym: "SCH",
    title: "Updated safeguarding contact procedure",
    excerpt:
      "An urgent reminder of the correct internal reporting route for learner safeguarding concerns.",
    message: [
      "All safeguarding concerns must be reported immediately through the designated school contact. Do not investigate the concern independently or discuss it in informal channels.",
      "If the designated contact is unavailable, report directly to the school administrator and record the time the concern was raised.",
    ],
    publisher: "School Administration",
    publisherRole: "School administrator",
    publishedAt: "2026-07-24T11:40:00.000Z",
    priority: "urgent",
    pinned: true,
    isRead: false,
    attachments: [
      {
        id: "ann-procedure",
        title: "Safeguarding reporting procedure",
        kind: "document",
        size: "95 KB",
      },
    ],
  },
];

export const notifications: TeacherNotification[] = [
  {
    id: "notification-announcement",
    category: "announcement",
    title: "New school announcement",
    body: "Sequence results review window",
    createdAt: "2026-07-28T07:25:00.000Z",
    isRead: false,
    schoolId: 1,
    schoolName: "Current school",
    destination: "/social/announcements/announcement-results-review",
  },
  {
    id: "notification-marks-open",
    category: "marks",
    title: "Marks entry is open",
    body: "Select a subject and class to complete the current sequence.",
    createdAt: "2026-07-27T15:10:00.000Z",
    isRead: false,
    destination: "/(tabs)/subjects",
  },
  {
    id: "notification-attendance-sync",
    category: "attendance",
    title: "Attendance synchronized",
    body: "Today’s saved attendance records are up to date.",
    createdAt: "2026-07-27T10:05:00.000Z",
    isRead: true,
    destination: "/(tabs)/attendance",
  },
  {
    id: "notification-profile",
    category: "profile",
    title: "Complete your professional profile",
    body: "Add qualifications and teaching specializations to improve profile completeness.",
    createdAt: "2026-07-25T09:00:00.000Z",
    isRead: false,
    destination: "/profile/edit",
  },
  {
    id: "notification-forum",
    category: "forum",
    title: "New academic publication",
    body: "Five-minute checks that improve formative assessment",
    createdAt: "2026-07-24T16:35:00.000Z",
    isRead: true,
    destination: "/social/forum/forum-formative-assessment",
  },
];

export const professionalProfile: ProfessionalProfile = {
  headline: "Secondary-school educator focused on measurable learner progress",
  city: "Douala",
  biography:
    "I support learners through clear explanations, regular formative assessment, and inclusive classroom routines. I enjoy collaborating with colleagues to turn assessment evidence into practical teaching decisions.",
  primaryField: "Mathematics education",
  additionalFields: ["Student assessment", "Educational technology"],
  subjects: ["Mathematics", "Further Mathematics"],
  levels: ["Lower secondary", "Upper secondary"],
  expertise: ["Formative assessment", "Lesson planning", "Differentiated instruction"],
  teachingLanguages: ["English", "French"],
  skills: [
    "Classroom management",
    "Lesson planning",
    "Student assessment",
    "Digital teaching tools",
    "Inclusive education",
    "Communication",
  ],
  qualifications: [
    {
      id: "qualification-1",
      degree: "Bachelor of Education",
      field: "Mathematics",
      institution: "University of Buea",
      location: "Cameroon",
      graduationYear: 2018,
      distinction: "Second Class, Upper Division",
      documentStatus: "not-added",
    },
  ],
  certifications: [
    {
      id: "certification-1",
      name: "Digital Pedagogy Foundations",
      issuer: "Cameroon Teachers Network",
      issueDate: "2024-08-12",
      status: "self-declared",
    },
  ],
  experience: [
    {
      id: "experience-1",
      organization: "Current assigned school",
      role: "Mathematics Teacher",
      subjects: ["Mathematics"],
      levels: ["Lower secondary", "Upper secondary"],
      startDate: "2019-09-01",
      current: true,
      responsibilities:
        "Plan and deliver lessons, assess learner progress, and collaborate on departmental improvement.",
      achievements: "Introduced weekly retrieval practice and common assessment reviews.",
    },
  ],
  languages: [
    {
      id: "language-1",
      name: "English",
      spoken: "Fluent",
      written: "Fluent",
      usedForTeaching: true,
    },
    {
      id: "language-2",
      name: "French",
      spoken: "Advanced",
      written: "Advanced",
      usedForTeaching: true,
    },
  ],
  documents: [
    {
      id: "document-cv",
      kind: "CV",
      title: "Curriculum vitae",
      updatedAt: "2026-06-10",
      status: "metadata-only",
      private: true,
    },
  ],
  professionalEmail: "",
  professionalPhone: "",
  visibility: {
    professionalEmail: false,
    professionalPhone: false,
    currentSchools: true,
  },
  verified: false,
};

