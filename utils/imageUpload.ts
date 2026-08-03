import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export interface PickedImage {
  /** Displayable immediately: `file://` on native, `blob:`/`data:` on web. */
  uri: string;
  fileName: string;
  mimeType: string;
}

const extensionFor = (mimeType: string) => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
};

/**
 * Asks for library permission (a no-op on web) and returns the chosen image,
 * or null if the user cancelled or denied access.
 */
export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType || "image/jpeg";
  return {
    uri: asset.uri,
    fileName: asset.fileName || `photo.${extensionFor(mimeType)}`,
    mimeType,
  };
}

/**
 * Appends a local file to FormData in the shape the current platform requires.
 *
 * React Native's FormData accepts a `{ uri, name, type }` descriptor and reads
 * the file itself. The browser's FormData does not — it needs a real Blob, so
 * on web the URI is fetched first. Sending the native descriptor on web
 * serialises it as the string "[object Object]", which the API rejects with a
 * 422 because the field is not a file.
 */
export async function appendImageToFormData(
  form: FormData,
  field: string,
  image: PickedImage,
): Promise<void> {
  if (Platform.OS === "web") {
    const response = await fetch(image.uri);
    const blob = await response.blob();
    // The browser knows the real type; a name guessed from a `blob:` URL has no
    // usable extension, so derive both from the blob and keep them consistent.
    // Laravel validates `mimes:` against the actual content, so a mismatched
    // name/type pair is what turns a valid PNG into a 422.
    const mimeType = blob.type || image.mimeType || "image/jpeg";
    const fileName = /\.[a-z0-9]+$/i.test(image.fileName)
      ? image.fileName
      : `${image.fileName.replace(/\.$/, "")}.${extensionFor(mimeType)}`;
    form.append(field, new File([blob], fileName, { type: mimeType }));
    return;
  }

  form.append(field, {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as unknown as Blob);
}
