import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "fobssms.offline.";

/** Reads a JSON value, returning null when absent or corrupt. */
export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // A corrupt entry must never break a screen; treat it as a cache miss.
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — caching is best-effort by design.
  }
}

export async function removeJson(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore: nothing depends on the delete succeeding.
  }
}
