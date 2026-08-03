export type SaveResult = "saved" | "denied" | "failed";

/**
 * Web implementation. Metro resolves `saveImage.native.ts` on iOS and Android,
 * so this file never pulls in expo-file-system / expo-media-library — those
 * packages extend native base classes that do not exist in a browser and throw
 * at module evaluation if bundled for web.
 *
 * There is no photo gallery on the web, so the browser download is the
 * equivalent action.
 */
export async function saveImageToDevice(url: string): Promise<SaveResult> {
  try {
    // Fetch to a blob first: a cross-origin `<a download>` is ignored by
    // browsers and would merely navigate to the image instead of saving it.
    const response = await fetch(url);
    if (!response.ok) return "failed";

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileNameFor(url);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    return "saved";
  } catch {
    return "failed";
  }
}

export function fileNameFor(url: string): string {
  const fromUrl = url.split("?")[0].split("/").pop();
  return fromUrl && /\.[a-z0-9]+$/i.test(fromUrl) ? fromUrl : `image-${Date.now()}.jpg`;
}
