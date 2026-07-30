import { SearchResults } from "@/social/models";
import { SearchRepository } from "@/social/repositories/contracts";
import { SearchResultsDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import {
  collectTeachersFromPost,
  mapJob,
  mapPost,
  mapTeacher,
} from "@/social/api/mappers";
import { socialStore } from "@/social/store/socialStore";

/** Shortest query the server accepts before answering 422. */
const MIN_QUERY_LENGTH = 2;

/**
 * Cross-entity search over teachers, posts and jobs.
 *
 * The combined shape the API returns for `type=all` matches the phase 1
 * `SearchResults` model exactly, so this is close to a pass-through. Blocked
 * accounts are filtered server-side in all three sections.
 */
export class SearchApiRepository implements SearchRepository {
  async search(query: string): Promise<SearchResults> {
    const term = query.trim();

    // The contract has no way to report "query too short", and the mock answered
    // empty sections for a blank query. Preserve that rather than surfacing a 422
    // for every keystroke as the user starts typing.
    if (term.length < MIN_QUERY_LENGTH) {
      return { teachers: [], posts: [], jobs: [] };
    }

    try {
      const results = await socialApi.get<SearchResultsDto>("/social/search", {
        query: { q: term, type: "all" },
      });

      const teachers = (results.teachers ?? []).map(mapTeacher);
      const posts = (results.posts ?? []).map(mapPost);
      const jobs = (results.jobs ?? []).map(mapJob);

      // Authors embedded in matched posts feed the same teacher cache the post
      // cards read names from.
      const postAuthors = (results.posts ?? []).flatMap(collectTeachersFromPost).map(mapTeacher);

      socialStore.upsertTeachers([...teachers, ...postAuthors]);
      socialStore.upsertPosts(posts);
      socialStore.upsertJobs(jobs);

      return { teachers, posts, jobs };
    } catch (cause) {
      if (cause instanceof SocialApiError && cause.code === "SEARCH_QUERY_REQUIRED") {
        return { teachers: [], posts: [], jobs: [] };
      }
      throw cause;
    }
  }
}
