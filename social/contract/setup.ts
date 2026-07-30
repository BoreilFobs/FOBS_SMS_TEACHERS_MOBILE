/**
 * Wiring for the live-backend contract suite.
 *
 * These tests exercise the real API repositories against a running Laravel
 * instance, which is the only way to prove the mappers, pagination and
 * business-rule error handling actually match the backend rather than matching
 * what we assumed it does.
 *
 * Skipped automatically when SOCIAL_CONTRACT_BASE_URL is unset, so `npm test`
 * stays hermetic. See docs/SOCIAL_API_MIGRATION.md for how to start the harness.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CONTRACT_BASE_URL = process.env.SOCIAL_CONTRACT_BASE_URL;
export const CONTRACT_TOKEN = process.env.SOCIAL_CONTRACT_TOKEN;

export const contractEnabled = Boolean(CONTRACT_BASE_URL && CONTRACT_TOKEN);

/** Ids seeded by the harness, passed through the environment. */
export const harness = {
  mutualTeacherId: process.env.SOCIAL_CONTRACT_MUTUAL_ID ?? "",
  oneWayTeacherId: process.env.SOCIAL_CONTRACT_ONEWAY_ID ?? "",
  strangerTeacherId: process.env.SOCIAL_CONTRACT_STRANGER_ID ?? "",
  myPostId: process.env.SOCIAL_CONTRACT_MY_POST_ID ?? "",
  theirPostId: process.env.SOCIAL_CONTRACT_THEIR_POST_ID ?? "",
  pollPostId: process.env.SOCIAL_CONTRACT_POLL_POST_ID ?? "",
  multiPollPostId: process.env.SOCIAL_CONTRACT_MULTI_POLL_POST_ID ?? "",
  openJobId: process.env.SOCIAL_CONTRACT_OPEN_JOB_ID ?? "",
  closedJobId: process.env.SOCIAL_CONTRACT_CLOSED_JOB_ID ?? "",
  pendingJobId: process.env.SOCIAL_CONTRACT_PENDING_JOB_ID ?? "",
};

/** Puts the harness token where `authFetch` looks for it. */
export async function authenticate(): Promise<void> {
  await AsyncStorage.setItem("auth_token", CONTRACT_TOKEN ?? "");
}
