import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export type SaveResult = "saved" | "denied" | "failed";

/**
 * Native implementation: download to the cache, then hand the file to the media
 * library so it lands in the user's photos.
 *
 * The web build resolves `saveImage.ts` instead — these packages extend native
 * base classes and crash a web bundle at module evaluation.
 */
export async function saveImageToDevice(url: string): Promise<SaveResult> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) return "denied";

    const downloaded = await File.downloadFileAsync(url, new Directory(Paths.cache), {
      idempotent: true,
    });

    await MediaLibrary.saveToLibraryAsync(downloaded.uri);

    // The gallery owns its own copy now; the cached one is dead weight.
    try {
      downloaded.delete();
    } catch {
      // Cache cleanup is best effort.
    }

    return "saved";
  } catch {
    return "failed";
  }
}

export function fileNameFor(url: string): string {
  const fromUrl = url.split("?")[0].split("/").pop();
  return fromUrl && /\.[a-z0-9]+$/i.test(fromUrl) ? fromUrl : `image-${Date.now()}.jpg`;
}
