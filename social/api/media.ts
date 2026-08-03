import { MediaDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import { appendImageToFormData } from "@/utils/imageUpload";
import { resolveMediaUrl } from "@/utils/photoUri";

/**
 * Post-image and profile-photo uploads.
 *
 * The backend uses a two-step flow: upload first to `POST /social/media`, then
 * reference the returned ids as `media_ids[]` when creating or editing a post.
 * That is what lets the server verify the uploader owns each image instead of
 * trusting a client-supplied URL, so the client must not shortcut it.
 *
 * Server-side constraints, matched exactly (do not relax without checking
 * `StoreMediaRequest` on the backend):
 *   field name  `file`
 *   mime types  jpeg, jpg, png, gif, webp, heic, heif  (svg is rejected)
 *   max size    8192 KB
 *   optional    `alt_text`, max 255 characters
 */

export const MEDIA_CONSTRAINTS = {
  field: "file",
  maxBytes: 8192 * 1024,
  mimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
  ],
  altTextMaxLength: 255,
} as const;

export interface UploadedMedia {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText?: string;
}

export interface LocalImage {
  /** Local file URI from expo-image-picker. */
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  altText?: string;
}

function inferMimeType(image: LocalImage): string {
  if (image.mimeType && MEDIA_CONSTRAINTS.mimeTypes.includes(image.mimeType as never)) {
    return image.mimeType;
  }

  const extension = (image.fileName ?? image.uri).split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

function inferFileName(image: LocalImage, mimeType: string): string {
  if (image.fileName) return image.fileName;
  const extension = mimeType.split("/")[1] ?? "jpg";
  return `upload-${Date.now()}.${extension}`;
}

/**
 * Rejects locally before spending the user's bandwidth on a request the server
 * would refuse anyway.
 */
export function validateLocalImage(image: LocalImage): SocialApiError | null {
  const mimeType = inferMimeType(image);

  if (!MEDIA_CONSTRAINTS.mimeTypes.includes(mimeType as never)) {
    return new SocialApiError({
      message: "That image format is not supported.",
      code: "MEDIA_UNSUPPORTED_TYPE",
      status: 0,
      kind: "validation",
    });
  }

  if (image.fileSize && image.fileSize > MEDIA_CONSTRAINTS.maxBytes) {
    return new SocialApiError({
      message: "That image is larger than 8 MB.",
      code: "MEDIA_TOO_LARGE",
      status: 0,
      kind: "validation",
    });
  }

  return null;
}

export async function uploadImage(
  image: LocalImage,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<UploadedMedia> {
  const invalid = validateLocalImage(image);
  if (invalid) throw invalid;

  const mimeType = inferMimeType(image);
  const form = new FormData();

  // Native takes a {uri, name, type} descriptor; the browser needs a real Blob.
  // Sending the descriptor on web posts "[object Object]" and the server
  // answers 422 because the field never arrives as a file.
  await appendImageToFormData(form, MEDIA_CONSTRAINTS.field, {
    uri: image.uri,
    fileName: inferFileName(image, mimeType),
    mimeType,
  });

  if (image.altText) {
    form.append("alt_text", image.altText.slice(0, MEDIA_CONSTRAINTS.altTextMaxLength));
  }

  const dto = await socialApi.upload<MediaDto>("/social/media", form, options);

  // A freshly uploaded record comes back with the same server-built URL as the
  // feed, so it needs the same repair before anything tries to render it.
  const url = resolveMediaUrl(dto.url) ?? dto.url;

  return {
    id: String(dto.id),
    url,
    thumbnailUrl: resolveMediaUrl(dto.thumbnail_url) ?? url,
    altText: dto.alt_text ?? undefined,
  };
}

/**
 * Uploads a batch, reporting overall progress.
 *
 * Sequential on purpose: several concurrent multipart uploads on a mobile
 * connection tend to make every one of them slower and time out together.
 * Partial success is surfaced rather than swallowed so the composer can offer a
 * retry for the images that failed, per section 6.
 */
export async function uploadImages(
  images: LocalImage[],
  options: {
    onProgress?: (fraction: number) => void;
    onImageUploaded?: (media: UploadedMedia, index: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<{ uploaded: UploadedMedia[]; failures: { image: LocalImage; error: SocialApiError }[] }> {
  const uploaded: UploadedMedia[] = [];
  const failures: { image: LocalImage; error: SocialApiError }[] = [];

  for (let index = 0; index < images.length; index += 1) {
    if (options.signal?.aborted) break;

    const image = images[index];

    try {
      const media = await uploadImage(image, {
        signal: options.signal,
        onProgress: (fraction) =>
          options.onProgress?.((index + fraction) / images.length),
      });

      uploaded.push(media);
      options.onImageUploaded?.(media, index);
    } catch (cause) {
      failures.push({
        image,
        error:
          cause instanceof SocialApiError
            ? cause
            : new SocialApiError({
                message: cause instanceof Error ? cause.message : "Upload failed.",
                code: "MEDIA_UPLOAD_FAILED",
                status: 0,
                kind: "unknown",
              }),
      });
    }
  }

  options.onProgress?.(1);

  return { uploaded, failures };
}

/** Deletes an upload that was never attached, so cancelling leaves no orphans. */
export async function discardUpload(mediaId: string): Promise<void> {
  try {
    await socialApi.delete<void>(`/social/media/${mediaId}`);
  } catch {
    // Best effort: an orphaned unattached upload is harmless and the server
    // prunes nothing the user can see. Never surface this to the composer.
  }
}
