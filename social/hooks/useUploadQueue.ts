import { useCallback, useSyncExternalStore } from "react";
import { uploadQueue, UploadJob } from "@/social/store/uploadQueue";
import { PostDraft } from "@/social/models";
import { PostsRepository } from "@/social/repositories/contracts";

export function useUploadJobs(): UploadJob[] {
  return useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot, uploadQueue.getSnapshot);
}

/**
 * Runs a queued publish to completion.
 *
 * Kept outside React so it survives the composer unmounting the moment the
 * teacher is sent back to the feed.
 */
export async function runUploadJob(
  repository: PostsRepository,
  job: { id: string; kind: "create" | "edit"; postId?: string; draft: PostDraft },
  onDone?: () => void,
): Promise<void> {
  const report = (fraction: number) => uploadQueue.setProgress(job.id, fraction);

  try {
    if (job.kind === "edit" && job.postId) {
      await repository.editPost(job.postId, job.draft, report);
    } else {
      await repository.createPost(job.draft, report);
    }
    uploadQueue.remove(job.id);
    onDone?.();
  } catch (cause) {
    uploadQueue.fail(
      job.id,
      cause instanceof Error ? cause.message : "Upload failed",
    );
  }
}

export function useUploadActions(repository: PostsRepository, onDone?: () => void) {
  const retry = useCallback(
    (id: string) => {
      const job = uploadQueue.find(id);
      if (!job) return;
      uploadQueue.retry(id);
      void runUploadJob(repository, job, onDone);
    },
    [repository, onDone],
  );

  const dismiss = useCallback((id: string) => uploadQueue.remove(id), []);

  return { retry, dismiss };
}
