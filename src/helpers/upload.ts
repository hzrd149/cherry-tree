import { Chunk } from "./blob";
import { BlossomOptions, uploadBlob } from "./blossom";

type UploadOptions = BlossomOptions & {
  onUpload?: (server: string, chunk: Chunk) => void;
  onError?: (server: string, chunk: Chunk, error: Error) => void;
  parallel?: number;
};

export async function uploadChunks(servers: string[], chunks: Chunk[], opts?: UploadOptions) {
  const parallel = opts?.parallel ?? 5;
  let batch: Promise<any>[] = [];

  for (const chunk of chunks) {
    batch.push(
      ...servers.map((server) =>
        uploadBlob(server, chunk, opts)
          .then(() => {
            opts?.onUpload?.(server, chunk);
          })
          .catch((error) => {
            opts?.onError?.(server, chunk, error);
          }),
      ),
    );

    if (batch.length >= parallel) await Promise.allSettled(batch);
  }

  if (batch.length > 0) await Promise.allSettled(batch);
}
