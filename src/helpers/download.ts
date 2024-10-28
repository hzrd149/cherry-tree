import { BlossomOptions, downloadBlob } from "./blossom";

type DownloadOptions = BlossomOptions & {
  parallel?: number;
  onBlob?: (chunk: Blob, index: number) => Promise<void>;
  onError?: (hash: string, error: Error) => void;
};

export async function downloadChunks(servers: string[], hashes: (string | null)[], opts?: DownloadOptions) {
  const download = async (hash: string, index: number) => {
    for (const server of servers) {
      try {
        const blob = await downloadBlob(server, hash, opts);
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
