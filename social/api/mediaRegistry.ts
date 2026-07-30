/**
 * URL → media-id lookup for already-uploaded post images.
 *
 * The phase 1 domain model stores post images as plain URL strings
 * (`SocialPost.images: string[]`), but editing a post has to send `media_ids[]`.
 * Rather than change the model — and with it every component that renders
 * `post.images` — this registry remembers the id behind each URL as posts are
 * mapped, so an edit that keeps an existing image can resolve it back.
 *
 * Bounded so a long scrolling session cannot grow it without limit.
 */

const MAX_ENTRIES = 500;

const idsByUrl = new Map<string, number>();

export function rememberMediaUrl(url: string, id: string | number): void {
  if (!url) return;

  // Re-inserting moves the key to the end, which keeps the eviction order honest.
  idsByUrl.delete(url);
  idsByUrl.set(url, Number(id));

  if (idsByUrl.size > MAX_ENTRIES) {
    const oldest = idsByUrl.keys().next();
    if (!oldest.done) idsByUrl.delete(oldest.value);
  }
}

export function mediaIdForUrl(url: string): number | null {
  const id = idsByUrl.get(url);
  return id === undefined || Number.isNaN(id) ? null : id;
}

export function clearMediaRegistry(): void {
  idsByUrl.clear();
}
