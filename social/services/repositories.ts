import { ApiSocialRepository } from "@/social/repositories/api/ApiSocialRepository";

/**
 * The only binding screens and hooks consume.
 *
 * Backed by the real Laravel API. The in-memory mock this used to point at has
 * been deleted — there is no mock-vs-real toggle, and the server is the single
 * source of truth for everything in the professional network.
 */
export const socialRepositories = new ApiSocialRepository();
