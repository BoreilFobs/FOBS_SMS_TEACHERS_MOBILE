import { InMemorySocialRepository } from "@/social/mock/repositories/InMemorySocialRepository";
import { describe, expect, it } from "@jest/globals";

describe("InMemorySocialRepository", () => {
  it("ranks followed content and removes blocked authors", async () => {
    const repository = new InMemorySocialRepository();
    await repository.block("teacher-daniel");
    const page = await repository.getFeed("0", 20);
    expect(page.items.some((post) => post.authorId === "teacher-daniel")).toBe(false);
    expect(page.items.slice(0, 4).some((post) => post.authorId === "teacher-aïcha")).toBe(true);
  });

  it("keeps reactions, polls, comments and safe parent deletion consistent", async () => {
    const repository = new InMemorySocialRepository();
    await repository.react("post-1", "love");
    const reacted = repository.getSnapshot().posts.find((post) => post.id === "post-1");
    expect(reacted?.currentUserReaction).toBe("love");

    await repository.vote("post-3", ["poll-3-a"]);
    const poll = repository.getSnapshot().posts.find((post) => post.id === "post-3");
    expect(poll?.type === "poll" && poll.poll.currentUserOptionIds).toEqual(["poll-3-a"]);

    const parent = await repository.addComment("post-1", "A parent comment");
    await repository.addComment("post-1", "A reply", parent.id);
    await repository.deleteComment(parent.id);
    expect(repository.getSnapshot().comments.find((comment) => comment.id === parent.id)?.deleted).toBe(true);
  });

  it("enables messaging only for mutual followers and updates read state", async () => {
    const repository = new InMemorySocialRepository();
    await expect(repository.startConversation("teacher-clarisse")).rejects.toThrow(
      "MUTUAL_FOLLOW_REQUIRED",
    );
    await repository.follow("teacher-clarisse");
    const conversation = await repository.startConversation("teacher-clarisse");
    await repository.sendMessage(conversation.id, "Hello colleague");
    expect(
      repository
        .getSnapshot()
        .conversations.find((item) => item.id === conversation.id)
        ?.messages.at(-1)?.status,
    ).toBe("sent");
  });

  it("prevents duplicate applications and locks viewed applications", async () => {
    const repository = new InMemorySocialRepository();
    await expect(
      repository.apply("job-2", "Updated motivation", "Next term"),
    ).rejects.toThrow("ALREADY_APPLIED");
    await expect(
      repository.editApplication("application-viewed", "New motivation", "Now"),
    ).rejects.toThrow("APPLICATION_READ_ONLY");
    const updated = await repository.editApplication(
      "application-submitted",
      "A clearer motivation",
      "September",
    );
    expect(updated.motivation).toBe("A clearer motivation");
  });
});
