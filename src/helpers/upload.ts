import { multiServerUpload, MultiServerUploadOptions } from "blossom-client-sdk/actions/upload";
import { Chunk } from "./blob";

type UploadOptions = MultiServerUploadOptions<string, Chunk> & {
  parallel?: number;
};

export async function uploadChunks(servers: string[], chunks: Chunk[], opts?: UploadOptions) {
  const parallel = opts?.parallel ?? 5;
  let batch: Promise<any>[] = [];

  for (const chunk of chunks) {
    batch.push(multiServerUpload(servers, chunk, opts));

    // wait for batch
    if (batch.length >= parallel) await Promise.allSettled(batch);
    batch = [];
  }

  // wait for complete
  if (batch.length > 0) await Promise.allSettled(batch);
}
