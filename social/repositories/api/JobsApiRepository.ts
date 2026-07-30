import { Job, JobApplication, JobFilters } from "@/social/models";
import { JobsRepository } from "@/social/repositories/contracts";
import { JobApplicationDto, JobDto, SavedStateDto } from "@/social/api/dto";
import { socialApi } from "@/social/api/client";
import { SocialApiError } from "@/social/api/errors";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { mapApplication, mapJob } from "@/social/api/mappers";
import { socialStore } from "@/social/store/socialStore";

/**
 * Teacher-facing jobs: browse, filter, save, apply, and revise an application
 * while it is still editable.
 *
 * Publishing and verification belong to the school-admin phase and have no client
 * surface. Only verified, published postings are ever returned.
 */
export class JobsApiRepository implements JobsRepository {
  /**
   * Filtering is delegated to the server rather than done in memory.
   *
   * The mock filtered a full in-memory list; the API applies every filter in SQL
   * over the whole corpus, so results are correct beyond the first page. Note
   * `experienceYears` maps to `max_experience` — the server reads it as "show
   * postings asking for no more than this", which is what the mock's
   * `job.experienceYears <= filters.experienceYears` predicate meant.
   */
  async getJobs(filters: JobFilters = {}): Promise<Job[]> {
    const page = await socialApi.getPage<JobDto>("/jobs", {
      query: {
        q: filters.query,
        subject: filters.subject,
        location: filters.location,
        qualification: filters.qualification,
        level: filters.level,
        employment_type: filters.employmentType,
        max_experience: filters.experienceYears,
        saved: filters.savedOnly ? 1 : undefined,
        limit: SOCIAL_NETWORK.pageSize,
      },
    });

    return this.absorb(page.data);
  }

  async getJob(id: string): Promise<Job | undefined> {
    try {
      const dto = await socialApi.get<JobDto>(`/jobs/${id}`);
      return this.absorb([dto])[0];
    } catch (cause) {
      // Unverified, unpublished and deleted postings are all reported as missing.
      if (cause instanceof SocialApiError && cause.kind === "not-found") return undefined;
      throw cause;
    }
  }

  async toggleSaved(jobId: string): Promise<void> {
    const before = socialStore.getSnapshot().jobs.find((job) => job.id === jobId);

    if (before) socialStore.patchJob(jobId, { saved: !before.saved });

    try {
      const state = await socialApi.post<SavedStateDto>(`/jobs/${jobId}/save/toggle`);
      socialStore.patchJob(jobId, { saved: Boolean(state.saved) });
    } catch (cause) {
      if (before) socialStore.patchJob(jobId, { saved: before.saved });
      throw cause;
    }
  }

  /**
   * Submits an application.
   *
   * Duplicate submissions answer 409 `ALREADY_APPLIED` and a closed posting
   * answers 409 `JOB_CLOSED`; both propagate with their server message so the
   * screen can say which one happened rather than "something went wrong".
   */
  async apply(jobId: string, motivation: string, availability: string): Promise<JobApplication> {
    const dto = await socialApi.post<JobApplicationDto>(`/jobs/${jobId}/applications`, {
      body: { motivation, expected_availability: availability },
    });

    const application = mapApplication(dto);
    socialStore.upsertApplications([application]);

    // The job payload embeds the teacher's application, so keep the cached job in
    // step without a second round trip.
    socialStore.patchJob(jobId, {});

    return application;
  }

  /**
   * Revises an application.
   *
   * Editable only while `submitted`. Once the school has viewed, accepted or
   * rejected it the server answers 409 `APPLICATION_LOCKED`, which is surfaced
   * verbatim.
   */
  async editApplication(
    applicationId: string,
    motivation: string,
    availability: string,
  ): Promise<JobApplication> {
    const dto = await socialApi.patch<JobApplicationDto>(
      `/teacher/job-applications/${applicationId}`,
      { body: { motivation, expected_availability: availability } },
    );

    const application = mapApplication(dto);
    socialStore.upsertApplications([application]);

    return application;
  }

  /** The current teacher's applications, with per-status counts in `meta`. */
  async getApplications(status?: JobApplication["status"]): Promise<JobApplication[]> {
    const page = await socialApi.getPage<JobApplicationDto>("/teacher/job-applications", {
      query: { status, limit: SOCIAL_NETWORK.pageSize },
    });

    const applications = page.data.map(mapApplication);
    socialStore.upsertApplications(applications);

    return applications;
  }

  /**
   * Stores jobs and the applications embedded in them, so the job detail screen
   * can show "you applied" straight from the cache.
   */
  private absorb(dtos: JobDto[]): Job[] {
    const jobs = dtos.map(mapJob);
    const applications = dtos
      .map((dto) => dto.application)
      .filter((application): application is JobApplicationDto => Boolean(application))
      .map(mapApplication);

    socialStore.upsertJobs(jobs);
    socialStore.upsertApplications(applications);

    return jobs;
  }
}
