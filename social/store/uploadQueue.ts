import { PostDraft } from "@/social/models";

export type UploadStatus = "uploading" | "failed";

export interface UploadJob {
  id: string;
  kind: "create" | "edit";
  /** Target post id, for edits. */
  postId?: string;
  draft: PostDraft;
  /** 0..1 across the image uploads. */
  progress: number;
  status: UploadStatus;
  error?: string;
  /** First image, shown as a thumbnail in the banner. */
  previewUri?: string;
}

type Listener = () => void;

/**
 * Pending post publishes.
 *
 * Publishing returns the teacher to the feed immediately and continues in the
 * background, so the work has to live outside the composer's component tree —
 * that screen is unmounted before the upload finishes.
 */
class UploadQueueStore {
  private jobs: UploadJob[] = [];
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.jobs;

  private emit() {
    // A new array identity is required for useSyncExternalStore to re-render.
    this.jobs = [...this.jobs];
    this.listeners.forEach((listener) => listener());
  }

  enqueue(job: Omit<UploadJob, "progress" | "status">): string {
    this.jobs = [...this.jobs, { ...job, progress: 0, status: "uploading" }];
    this.emit();
    return job.id;
  }

  setProgress(id: string, progress: number) {
    this.jobs = this.jobs.map((job) =>
      job.id === id ? { ...job, progress: Math.min(1, Math.max(0, progress)) } : job,
    );
    this.emit();
  }

  fail(id: string, error: string) {
    this.jobs = this.jobs.map((job) =>
      job.id === id ? { ...job, status: "failed", error } : job,
    );
    this.emit();
  }

  retry(id: string) {
    this.jobs = this.jobs.map((job) =>
      job.id === id
        ? { ...job, status: "uploading", progress: 0, error: undefined }
        : job,
    );
    this.emit();
  }

  remove(id: string) {
    this.jobs = this.jobs.filter((job) => job.id !== id);
    this.emit();
  }

  find(id: string) {
    return this.jobs.find((job) => job.id === id);
  }
}

export const uploadQueue = new UploadQueueStore();
