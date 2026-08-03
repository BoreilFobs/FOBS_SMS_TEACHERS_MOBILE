import Config from "@/constants/Config";

/**
 * Resolves a stored media path or URL to something <Image> can load.
 *
 * Photos arrive in three shapes depending on where they came from:
 * an absolute URL (social API / OAuth), a freshly picked local file, or a
 * storage-relative path written by the Laravel upload endpoint.
 */
export function resolveMediaUrl(photo?: string | null): string | undefined {
  if (!photo) return undefined;
  const value = photo.trim();
  if (!value) return undefined;

  // Local sources are already loadable as-is.
  if (/^(file|data|blob):/i.test(value)) return value;

  // Some stored records lost the colon in their scheme ("https//host/..."),
  // which a browser resolves as a *relative* path against the dev server and
  // 404s. Repair those rather than trusting a naive startsWith("http").
  const repaired = value.replace(/^(https?)\/\//i, "$1://");
  if (/^https?:\/\//i.test(repaired)) {
    // Rebuild against the configured host so photos always come from the
    // server this build talks to, not whatever host was baked in at upload.
    const path = repaired.replace(/^https?:\/\/[^/]+/i, "");
    return joinStorageUrl(path);
  }

  return joinStorageUrl(value);
}

/** Builds `<webBaseUrl>/storage/<path>` without doubling slashes or `storage/`. */
function joinStorageUrl(path: string): string {
  const base = Config.webBaseUrl.replace(/\/+$/, "");
  const clean = path.replace(/^\/+/, "").replace(/^storage\//i, "");
  return `${base}/storage/${clean}`;
}
