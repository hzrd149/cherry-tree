import { downloadBlob, DownloadOptions } from "blossom-client-sdk/actions/download";

type DownloadChunksOptions = DownloadOptions<string> & {
  parallel?: number;
  onBlob?: (chunk: Blob, index: number) => Promise<void>;
  onError?: (hash: string, error: Error) => void;
};

export async function downloadChunks(servers: string[], hashes: (string | null)[], opts?: DownloadChunksOptions) {
  const download = async (hash: string, index: number) => {
    for (const server of servers) {
      try {
        const res = await downloadBlob(server, hash, opts);
        const blob = await res.blob();
        await opts?.onBlob?.(blob, index);
        return;
      } catch (error) {
        console.log(error);
        if (error instanceof Error) opts?.onError?.(hash, error);
      }
    }
  };

  const parallel = opts?.parallel ?? 5;
  let batch: Promise<void>[] = [];
  for (let index = 0; index < hashes.length; index++) {
    if (opts?.signal?.aborted) break;

    const hash = hashes[index];
    if (hash === null) continue;

    batch.push(download(hash, index));
    if (batch.length >= parallel) {
      await Promise.allSettled(batch);
      batch = [];
    }
  }

  if (batch.length > 0) await Promise.allSettled(batch);
}
