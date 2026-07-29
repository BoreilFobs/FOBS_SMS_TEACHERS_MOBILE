import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Fetch wrapper for every authenticated teacher API request.
 *
 * Keeping token injection here prevents individual screens from accidentally
 * calling protected endpoints anonymously.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await AsyncStorage.getItem("auth_token");
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
