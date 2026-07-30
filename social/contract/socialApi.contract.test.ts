/**
 * Live-backend contract suite.
 *
 * Runs the real API repositories against a running Laravel instance and asserts
 * the behaviour each migrated feature area is supposed to have — mapper output,
 * cursor pagination, optimistic reconciliation, and the specific business-rule
 * errors the UI branches on.
 *
 * This is what makes "verified against the real backend" true rather than
 * aspirational: a typecheck cannot catch a renamed field or a rule that fires
 * differently than assumed.
 *
 * Requires the harness (see docs/SOCIAL_API_MIGRATION.md). Skipped when absent.
 */
import { afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import { authenticate, contractEnabled, harness } from "./setup";
import { ApiSocialRepository } from "@/social/repositories/api/ApiSocialRepository";
import { SocialApiError } from "@/social/api/errors";
import { socialStore } from "@/social/store/socialStore";
import { CURRENT_TEACHER_ID } from "@/social/models";

const describeContract = contractEnabled ? describe : describe.skip;

describeContract("social API contract (live backend)", () => {
  let repository: ApiSocialRepository;

  beforeAll(async () => {
    await authenticate();
    repository = new ApiSocialRepository();
    await repository.ensureIdentity();
  }, 30_000);

  afterEach(() => {
    // Each block asserts against a freshly fetched cache.
    socialStore.reset();
  });

  // ------------------------------------------------------------------ identity

  it("resolves the session teacher and maps their id to the CURRENT_TEACHER_ID sentinel", async () => {
    const me = await repository.ensureIdentity();

    expect(me.id).toBe(CURRENT_TEACHER_ID);
    expect(me.name).toBeTruthy();
    expect(me.headline).toBeTruthy();
    // The sentinel must be resolvable back to a profile the screens can render.
    const cached = repository.getSnapshot().teachers.find((t) => t.id === CURRENT_TEACHER_ID);
    expect(cached).toBeDefined();
  });

  // ---------------------------------------------------------------- feed/posts

  it("maps a feed page and paginates with the server cursor", async () => {
    const first = await repository.getFeed(undefined, 3);

    expect(first.items.length).toBeGreaterThan(0);
    expect(first.items.length).toBeLessThanOrEqual(3);
    expect(first.nextCursor).toBeTruthy();

    const post = first.items[0];
    expect(typeof post.id).toBe("string");
    expect(typeof post.authorId).toBe("string");
    expect(Array.isArray(post.images)).toBe(true);
    expect(post.reactions.breakdown).toEqual(
      expect.objectContaining({ like: expect.any(Number), love: expect.any(Number) }),
    );

    const second = await repository.getFeed(first.nextCursor, 3);
    const firstIds = first.items.map((item) => item.id);
    const secondIds = second.items.map((item) => item.id);

    // Pages must not overlap, or the feed would show duplicates.
    expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([]);

    // Authors travel with the page, so no extra request is needed to render names.
    expect(repository.getSnapshot().teachers.length).toBeGreaterThan(0);
  }, 30_000);

  it("publishes, edits and deletes a post, and reports the author's own id as the sentinel", async () => {
    const created = await repository.createPost({
      type: "text",
      text: "Contract suite post about #assessment routines",
      images: [],
      category: "Assessment",
    });

    expect(created.authorId).toBe(CURRENT_TEACHER_ID);
    expect(created.hashtags).toContain("assessment");
    expect(created.editedAt).toBeUndefined();

    const edited = await repository.editPost(created.id, {
      type: "text",
      text: "Contract suite post, revised",
      images: [],
      category: "Pedagogy",
    });

    expect(edited.text).toBe("Contract suite post, revised");
    expect(edited.editedAt).toBeTruthy();
    expect(edited.category).toBe("Pedagogy");

    await repository.deletePost(created.id);
    expect(repository.getSnapshot().posts.find((p) => p.id === created.id)).toBeUndefined();
    await expect(repository.getPost(created.id)).resolves.toBeUndefined();
  }, 30_000);

  it("refuses to publish an empty post with a field-level validation error", async () => {
    await expect(
      repository.createPost({ type: "text", text: "   ", images: [] }),
    ).rejects.toMatchObject({ kind: "validation" });

    try {
      await repository.createPost({ type: "text", text: "   ", images: [] });
    } catch (cause) {
      const error = cause as SocialApiError;
      // The screen shows this string; it must be real text, not a code.
      expect(error.fieldError("text") ?? error.message).toBeTruthy();
      expect(error.message).not.toBe("POST_CONTENT_REQUIRED");
    }
  }, 30_000);

  // ----------------------------------------------------------------- reactions

  it("adds, changes, toggles off and removes a reaction, reconciling with the server summary", async () => {
    const postId = harness.theirPostId;
    await repository.getPost(postId);

    await repository.react(postId, "insightful");
    let post = repository.getSnapshot().posts.find((p) => p.id === postId);
    expect(post?.currentUserReaction).toBe("insightful");
    expect(post?.reactions.breakdown.insightful).toBe(1);
    expect(post?.reactions.total).toBe(1);

    await repository.react(postId, "celebrate");
    post = repository.getSnapshot().posts.find((p) => p.id === postId);
    expect(post?.currentUserReaction).toBe("celebrate");
    expect(post?.reactions.breakdown.insightful).toBe(0);
    expect(post?.reactions.total).toBe(1);

    // Re-sending the same reaction clears it.
    await repository.react(postId, "celebrate");
    post = repository.getSnapshot().posts.find((p) => p.id === postId);
    expect(post?.currentUserReaction).toBeUndefined();
    expect(post?.reactions.total).toBe(0);
  }, 30_000);

  // ------------------------------------------------------------------ comments

  it("threads replies one level deep and leaves a placeholder when a parent is deleted", async () => {
    const postId = harness.theirPostId;

    const parent = await repository.addComment(postId, "Contract parent comment");
    const reply = await repository.addComment(postId, "Contract reply", parent.id);

    expect(reply.parentId).toBe(parent.id);
    expect(parent.authorId).toBe(CURRENT_TEACHER_ID);

    const listed = await repository.getComments(postId);
    expect(listed.some((c) => c.id === parent.id)).toBe(true);
    expect(listed.some((c) => c.id === reply.id)).toBe(true);

    // Deleting a commented-on comment leaves a tombstone, not a hole.
    await repository.deleteComment(parent.id);
    const afterDelete = await repository.getComments(postId);
    const tombstone = afterDelete.find((c) => c.id === parent.id);

    expect(tombstone?.deleted).toBe(true);
    expect(tombstone?.text).toBe("");
    // A tombstone must not re-expose who wrote it.
    expect(tombstone?.authorId).toBe("");
    // The reply survives its parent.
    expect(afterDelete.some((c) => c.id === reply.id && !c.deleted)).toBe(true);

    await repository.deleteComment(reply.id);
  }, 30_000);

  it("rejects a reply to a reply", async () => {
    const parent = await repository.addComment(harness.theirPostId, "Depth parent");
    const reply = await repository.addComment(harness.theirPostId, "Depth reply", parent.id);

    await expect(
      repository.addComment(harness.theirPostId, "Too deep", reply.id),
    ).rejects.toMatchObject({ code: "REPLY_DEPTH_EXCEEDED" });

    await repository.deleteComment(reply.id);
    await repository.deleteComment(parent.id);
  }, 30_000);

  // --------------------------------------------------------------------- polls

  it("votes on a single-choice poll and rejects a multi-selection", async () => {
    const post = await repository.getPost(harness.pollPostId);
    expect(post?.type).toBe("poll");
    if (post?.type !== "poll") throw new Error("harness poll missing");

    const [first, second] = post.poll.options;

    await expect(
      repository.vote(post.id, [first.id, second.id]),
    ).rejects.toMatchObject({ code: "POLL_SINGLE_CHOICE" });

    await repository.vote(post.id, [first.id]);
    const voted = repository.getSnapshot().posts.find((p) => p.id === post.id);
    if (voted?.type !== "poll") throw new Error("poll vanished");

    expect(voted.poll.currentUserOptionIds).toEqual([first.id]);
    expect(voted.poll.options.find((o) => o.id === first.id)?.votes).toBe(1);

    // Revoting replaces rather than accumulating — no duplicate vote is possible.
    await repository.vote(post.id, [second.id]);
    const revoted = repository.getSnapshot().posts.find((p) => p.id === post.id);
    if (revoted?.type !== "poll") throw new Error("poll vanished");

    expect(revoted.poll.currentUserOptionIds).toEqual([second.id]);
    expect(revoted.poll.options.find((o) => o.id === first.id)?.votes).toBe(0);
    expect(revoted.poll.options.find((o) => o.id === second.id)?.votes).toBe(1);
  }, 30_000);

  it("accepts several options on a multiple-choice poll and rejects a foreign option", async () => {
    const post = await repository.getPost(harness.multiPollPostId);
    if (post?.type !== "poll") throw new Error("harness multi poll missing");

    await repository.vote(post.id, [post.poll.options[0].id, post.poll.options[2].id]);

    const voted = repository.getSnapshot().posts.find((p) => p.id === post.id);
    if (voted?.type !== "poll") throw new Error("poll vanished");
    expect(voted.poll.currentUserOptionIds).toHaveLength(2);

    const other = await repository.getPost(harness.pollPostId);
    if (other?.type !== "poll") throw new Error("harness poll missing");

    await expect(
      repository.vote(post.id, [other.poll.options[0].id]),
    ).rejects.toMatchObject({ code: "INVALID_POLL_SELECTION" });
  }, 30_000);

  // ------------------------------------------------------------------- network

  it("follows and unfollows, and refuses a self-follow", async () => {
    const target = harness.strangerTeacherId;
    await repository.getTeacher(target);

    await repository.follow(target);
    expect(
      repository.getSnapshot().teachers.find((t) => t.id === target)?.followedByCurrentUser,
    ).toBe(true);

    await repository.follow(target);
    expect(
      repository.getSnapshot().teachers.find((t) => t.id === target)?.followedByCurrentUser,
    ).toBe(false);

    await expect(repository.follow(CURRENT_TEACHER_ID)).rejects.toMatchObject({
      code: "CANNOT_FOLLOW_SELF",
    });
  }, 30_000);

  it("blocks bidirectionally, hides the profile, and reports a block conflict on follow", async () => {
    const target = harness.strangerTeacherId;

    // Load them first: blocking is always offered from a screen already showing
    // the teacher, and the profile becomes unreachable once blocked.
    await repository.getTeacher(target);
    await repository.block(target);
    expect(repository.getSnapshot().teachers.find((t) => t.id === target)?.blocked).toBe(true);

    // The profile becomes unreachable in both directions.
    await expect(repository.getTeacher(target)).resolves.toBeUndefined();

    await expect(repository.follow(target)).rejects.toMatchObject({
      code: "BLOCK_CONFLICT",
    });

    const blocked = await repository.getBlockedTeachers();
    expect(blocked.some((teacher) => teacher.id === target)).toBe(true);

    await repository.unblock(target);
    const after = await repository.getTeacher(target);
    expect(after?.blocked).toBe(false);
  }, 30_000);

  it("excludes blocked authors from the feed and search", async () => {
    const target = harness.strangerTeacherId;

    await repository.block(target);

    const feed = await repository.getFeed(undefined, 50);
    expect(feed.items.some((post) => post.authorId === target)).toBe(false);

    const results = await repository.search("classroom");
    expect(results.posts.some((post) => post.authorId === target)).toBe(false);
    expect(results.teachers.some((teacher) => teacher.id === target)).toBe(false);

    await repository.unblock(target);
  }, 30_000);

  // ------------------------------------------------------------------- profile

  it("never exposes private fields on another teacher's public profile", async () => {
    const teacher = await repository.getTeacher(harness.strangerTeacherId);
    expect(teacher).toBeDefined();

    const serialised = JSON.stringify(teacher);
    // The harness seeds this teacher with a private phone and address.
    expect(serialised).not.toContain("+237699000111");
    expect(serialised).not.toContain("Private Road");
    expect(serialised).not.toContain("@fobssms.test");
  }, 30_000);

  it("updates only the social profile fields and reads them back", async () => {
    const updated = await repository.updateOwnProfile({
      headline: "Contract suite headline",
      city: "Buea",
      skills: ["Assessment", "Mentoring"],
    });

    expect(updated.headline).toBe("Contract suite headline");
    expect(updated.city).toBe("Buea");
    expect(updated.skills).toEqual(["Assessment", "Mentoring"]);
    expect(updated.id).toBe(CURRENT_TEACHER_ID);
  }, 30_000);

  // -------------------------------------------------------------------- search

  it("returns the three typed sections and treats a too-short query as empty", async () => {
    const results = await repository.search("Mathematics");

    expect(Array.isArray(results.teachers)).toBe(true);
    expect(Array.isArray(results.posts)).toBe(true);
    expect(Array.isArray(results.jobs)).toBe(true);

    // A single character must not raise a 422 into the search box.
    await expect(repository.search("a")).resolves.toEqual({
      teachers: [],
      posts: [],
      jobs: [],
    });
  }, 30_000);

  // ---------------------------------------------------------------------- jobs

  it("filters jobs server-side and hides unverified postings", async () => {
    const all = await repository.getJobs();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((job) => job.title === "Unverified Vacancy")).toBe(false);

    const maths = await repository.getJobs({ subject: "Mathematics" });
    expect(maths.every((job) => job.subjects.includes("Mathematics"))).toBe(true);

    const partTime = await repository.getJobs({ employmentType: "part-time" });
    expect(partTime.every((job) => job.employmentType === "part-time")).toBe(true);

    // `experienceYears` means "postings asking for no more than this".
    const junior = await repository.getJobs({ experienceYears: 2 });
    expect(junior.every((job) => job.experienceYears <= 2)).toBe(true);

    await expect(repository.getJob(harness.pendingJobId)).resolves.toBeUndefined();
  }, 30_000);

  it("saves and unsaves a job", async () => {
    await repository.getJob(harness.openJobId);

    await repository.toggleSaved(harness.openJobId);
    expect(repository.getSnapshot().jobs.find((j) => j.id === harness.openJobId)?.saved).toBe(true);

    const savedOnly = await repository.getJobs({ savedOnly: true });
    expect(savedOnly.some((job) => job.id === harness.openJobId)).toBe(true);

    await repository.toggleSaved(harness.openJobId);
    expect(repository.getSnapshot().jobs.find((j) => j.id === harness.openJobId)?.saved).toBe(false);
  }, 30_000);

  it("applies once, refuses a duplicate, refuses a closed posting, and allows an edit while submitted", async () => {
    const application = await repository.apply(
      harness.openJobId,
      "I have taught mathematics for eight years and would value this role.",
      "From September 2026",
    );

    expect(application.status).toBe("submitted");
    expect(application.teacherId).toBe(CURRENT_TEACHER_ID);

    await expect(
      repository.apply(harness.openJobId, "Trying again with more detail here.", "Immediately"),
    ).rejects.toMatchObject({ code: "ALREADY_APPLIED" });

    await expect(
      repository.apply(harness.closedJobId, "A motivation long enough to validate.", "Immediately"),
    ).rejects.toMatchObject({ code: "JOB_CLOSED" });

    const edited = await repository.editApplication(
      application.id,
      "A revised motivation with considerably more detail than before.",
      "From October 2026",
    );

    expect(edited.motivation).toContain("revised motivation");
    expect(edited.availability).toBe("From October 2026");

    const mine = await repository.getApplications();
    expect(mine.some((candidate) => candidate.id === application.id)).toBe(true);
  }, 30_000);

  // ----------------------------------------------------------------- messaging

  it("requires a mutual follow to open a conversation", async () => {
    // Follows me, but I do not follow back.
    await expect(
      repository.startConversation(harness.oneWayTeacherId),
    ).rejects.toMatchObject({ code: "MUTUAL_FOLLOW_REQUIRED" });

    const eligible = await repository.getEligibleTeachers();
    expect(eligible.some((teacher) => teacher.id === harness.mutualTeacherId)).toBe(true);
    expect(eligible.some((teacher) => teacher.id === harness.oneWayTeacherId)).toBe(false);
  }, 30_000);

  it("sends a message idempotently and re-checks eligibility when a follow is revoked", async () => {
    const conversation = await repository.startConversation(harness.mutualTeacherId);
    expect(conversation.participantIds).toContain(CURRENT_TEACHER_ID);

    const message = await repository.sendMessage(conversation.id, "Contract suite hello");
    expect(message.status).toBe("sent");
    expect(message.senderId).toBe(CURRENT_TEACHER_ID);

    const { messages } = await repository.getMessages(conversation.id);
    expect(messages.some((candidate) => candidate.id === message.id)).toBe(true);

    // Opening the same conversation again must not create a second one.
    const again = await repository.startConversation(harness.mutualTeacherId);
    expect(again.id).toBe(conversation.id);

    // Revoke my follow, then prove sending is refused on the NEXT send rather than
    // only at creation time.
    await repository.follow(harness.mutualTeacherId);
    try {
      await expect(
        repository.sendMessage(conversation.id, "Should be refused"),
      ).rejects.toMatchObject({ code: "MUTUAL_FOLLOW_REQUIRED" });

      // History survives; the conversation is read-only.
      await repository.getConversations();
      expect(repository.canSend(conversation.id)).toBe(false);
    } finally {
      // Restore the mutual follow for later runs.
      await repository.follow(harness.mutualTeacherId);
    }
  }, 45_000);

  it("counts unread messages and clears them on read", async () => {
    const conversations = await repository.getConversations();
    expect(Array.isArray(conversations)).toBe(true);

    if (conversations.length > 0) {
      await repository.markConversationRead(conversations[0].id);
      const after = repository
        .getSnapshot()
        .conversations.find((c) => c.id === conversations[0].id);
      expect(after?.unreadCount).toBe(0);
    }
  }, 30_000);

  // ------------------------------------------------------------- notifications

  it("serves all three notification categories, including the projected school one", async () => {
    const social = await repository.getNotifications("social");
    const jobs = await repository.getNotifications("jobs");
    const school = await repository.getNotifications("school");

    // Reacting/commenting earlier in this suite generated social notifications for
    // other teachers, not for me, so only assert shape here.
    expect(Array.isArray(social)).toBe(true);
    expect(social.every((item) => item.category === "social")).toBe(true);

    // Applying to a job in this suite notified me.
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((item) => item.category === "jobs")).toBe(true);
    // Destination must be a mapped local route, never a server-supplied URL.
    expect(jobs[0].destination.startsWith("/social/")).toBe(true);

    // The harness seeds one activity for my active school.
    expect(school.length).toBeGreaterThan(0);
    expect(school.every((item) => item.category === "school")).toBe(true);
    // Projected ids are source-prefixed so mark-as-read routes correctly.
    expect(school[0].id.startsWith("a_")).toBe(true);

    const counts = await repository.getUnreadCounts();
    expect(counts).toEqual(
      expect.objectContaining({
        social: expect.any(Number),
        jobs: expect.any(Number),
        school: expect.any(Number),
        messages: expect.any(Number),
      }),
    );
  }, 30_000);

  it("marks a projected school notification read without touching the source", async () => {
    const school = await repository.getNotifications("school");
    expect(school.length).toBeGreaterThan(0);

    await repository.markRead(school[0].id);

    const after = await repository.getNotifications("school");
    expect(after.find((item) => item.id === school[0].id)?.read).toBe(true);
  }, 30_000);

  it("marks a whole category read", async () => {
    await repository.markCategoryRead("jobs");

    const jobs = await repository.getNotifications("jobs");
    expect(jobs.every((item) => item.read)).toBe(true);

    const counts = await repository.getUnreadCounts();
    expect(counts.jobs).toBe(0);
  }, 30_000);

  // ---------------------------------------------------------------- moderation

  it("reports a post once and refuses a duplicate report", async () => {
    const postId = harness.theirPostId;

    // Reporting is offered from a post card, so the post is cached first.
    await repository.getPost(postId);
    await repository.reportPost(postId, "misinformation");
    expect(repository.getSnapshot().posts.find((p) => p.id === postId)?.reported).toBe(true);

    await expect(repository.reportPost(postId, "spam")).rejects.toMatchObject({
      code: "ALREADY_REPORTED",
    });
  }, 30_000);

  it("maps a free-text report reason onto the server vocabulary", async () => {
    const created = await repository.createPost({
      type: "text",
      text: "A post for the free-text report path",
      images: [],
    });

    // Another teacher's post is needed to report, so this asserts the mapping
    // instead: an unrecognised reason must not be rejected as invalid.
    await expect(repository.reportPost(created.id, "Something else entirely")).rejects.toMatchObject(
      { kind: "forbidden" },
    );

    await repository.deletePost(created.id);
  }, 30_000);

  // -------------------------------------------------------------- resilience
});
