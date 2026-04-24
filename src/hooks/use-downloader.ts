import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { saveAs } from "file-saver";

import { useWallet } from "../providers/wallet-provider";
import { Chunk, concatBlobs } from "../helpers/blob";
import BlobHasher from "../worker/hasher";
import { downloadChunks } from "../helpers/download";
import state from "../services/state";
import {
  downloadBlobFromLocalBlossomCache,
  getSelectedBlobStorageBackend,
  hasChunkInSelectedStorage,
  readChunkFromSelectedStorage,
  saveChunkToSelectedStorage,
} from "../helpers/blob-storage";

type DownloaderOptions = {
  persist?: boolean;
  name?: string;
  type?: string;
};

export default function useDownloader(servers: string[], hashes: string[], opts?: DownloaderOptions) {
  const toast = useToast();
  const wallet = useWallet();

  const [controller, setController] = useState<AbortController>();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<(string | null)[]>([]);
  const [downloaded, setDownloaded] = useState<(string | null)[]>([]);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const download = async () => {
    try {
      setLoading(true);
      setErrors({});
      const controller = new AbortController();
      setController(controller);

      const chunks: (Chunk | null)[] = new Array(hashes.length).fill(null);

      // read local chunks
      if (opts?.persist) {
        for (let index = 0; index < hashes.length; index++) {
          const hash = hashes[index];
          try {
            chunks[index] = await readChunkFromSelectedStorage(hash, index, controller.signal);
          } catch (error) {}
        }
      }

      const cached = chunks.map((chunk, index) => (chunk ? hashes[index] : null));
      setDownloaded(cached);
      setVerified(cached);

      // create hasher
      const hasher = new BlobHasher();

      // listen for finished chunks
      hasher.onChunk = (chunk) => {
        if (hashes[chunk.index] === chunk.hash) {
          setVerified((v) => [...v, chunk.hash]);

          chunks[chunk.index] = chunk;
          if (opts?.persist) saveChunkToSelectedStorage(chunk, controller.signal);
        } else setErrors((v) => ({ ...v, [chunk.hash]: new Error("Invalid Hash") }));
      };

      // download missing chunks
      // let optimized = false;
      const needDownload = chunks.map((chunk, i) => (chunk === null ? hashes[i] : null));

      if (opts?.persist && getSelectedBlobStorageBackend() === "local-blossom") {
        const downloadFromLocalCache = async (hash: string, index: number) => {
          try {
            const blob = await downloadBlobFromLocalBlossomCache(hash, servers, controller.signal);
            hasher.addToQueue(blob, index);
            setDownloaded((v) => [...v, hash]);
            needDownload[index] = null;
          } catch (error) {
            if (error instanceof Error) setErrors((v) => ({ ...v, [hash]: error }));
          }
        };

        const parallel = state.downloaders.value;
        let batch: Promise<void>[] = [];
        for (let index = 0; index < needDownload.length; index++) {
          if (controller.signal.aborted) break;

          const hash = needDownload[index];
          if (hash === null) continue;

          batch.push(downloadFromLocalCache(hash, index));
          if (batch.length >= parallel) {
            await Promise.allSettled(batch);
            batch = [];
          }
        }
        if (batch.length > 0) await Promise.allSettled(batch);
      }

      await downloadChunks(servers, needDownload, {
        parallel: state.downloaders.value,
        signal: controller.signal,
        onPayment: async (_server, _blob, request) => {
          // optimize the wallet on the first payment
          // if (!optimized) {
          //   optimized = true;
          //   await wallet.optimize(new Array(needDownload.length).fill(request.amount));
          // }

          if (!request.amount) throw new Error("Missing amount");
          return await wallet.send(request.amount);
        },
        onBlob: async (blob, index) => {
          hasher.addToQueue(blob, index);
          setDownloaded((v) => [...v, hashes[index]]);
        },
        onError: (hash, error) => setErrors((v) => ({ ...v, [hash]: error })),
      });

      await hasher.waitForComplete();
      hasher.stop();

      if (chunks.some((c) => c === null)) throw new Error("Missing Chunks");
      const blob = await concatBlobs(chunks as Chunk[]);

      const file = new File([blob], opts?.name || "file", { type: opts?.type });
      saveAs(file, file.name);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  // load cached chunks
  useEffect(() => {
    const controller = new AbortController();

    Promise.all(hashes.map((hash) => hasChunkInSelectedStorage(hash, controller.signal))).then((available) => {
      const arr = hashes.map((hash, index) => (available[index] ? hash : null));
      setDownloaded(arr);
      setVerified(arr);
    });

    return () => controller.abort();
  }, [hashes]);

  useEffect(() => {
    return () => controller?.abort();
  }, [controller]);

  return { download, downloaded, errors, verified, loading };
}
