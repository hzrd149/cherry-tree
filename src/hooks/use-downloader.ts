import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { useWallet } from "../providers/wallet-provider";
import { Chunk, concatBlobs } from "../helpers/blob";
import { listChunks, readChunk, saveChunk } from "../helpers/storage";
import BlobHasher from "../worker/hasher";
import { downloadChunks } from "../helpers/download";
import state from "../state";

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

      const folder = "storage" in navigator && opts?.persist ? await navigator.storage.getDirectory() : null;

      const chunks: (Chunk | null)[] = new Array(hashes.length).fill(null);

      // read local chunks
      if (folder) {
        for (let index = 0; index < hashes.length; index++) {
          const hash = hashes[index];
          try {
            chunks[index] = await readChunk(folder, hash, index);
          } catch (error) {}
        }
      }

      // create hasher
      const hasher = new BlobHasher();

      // listen for finished chunks
      hasher.onChunk = (chunk) => {
        if (hashes[chunk.index] === chunk.hash) {
          setVerified((v) => [...v, chunk.hash]);

          chunks[chunk.index] = chunk;
          if (folder) saveChunk(folder, chunk);
        } else setErrors((v) => ({ ...v, [chunk.hash]: new Error("Invalid Hash") }));
      };

      // download missing chunks
      let optimized = false;
      const blobs: (Blob | null)[] = new Array(hashes.length).fill(null);
      const needDownload = downloaded.map((c, i) => (c === null ? hashes[i] : null));
      await downloadChunks(servers, needDownload, {
        parallel: state.downloaders.value,
        signal: controller.signal,
        onPayment: async (_server, _blob, request) => {
          // optimize the wallet on the first payment
          if (!optimized) {
            optimized = true;
            await wallet.optimize(new Array(needDownload.length).fill(request.amount));
          }

          return await wallet.send(request.amount);
        },
        onBlob: async (blob, index) => {
          blobs[index] = blob;
          hasher.addToQueue(blob, index);
          setDownloaded((v) => [...v, hashes[index]]);
        },
        onError: (hash, error) => setErrors((v) => ({ ...v, [hash]: error })),
      });

      await hasher.waitForComplete();
      hasher.stop();

      if (chunks.some((c) => c === null)) throw new Error("Missing Chunks");
      const blob = await concatBlobs(chunks as Chunk[]);

      // open download window
      if (opts?.name || opts?.type) {
        const file = new File([blob], opts?.name || "file", { type: opts.type });
        window.open(URL.createObjectURL(file), "_blank");
      } else window.open(URL.createObjectURL(blob));
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  // load cached chunks
  useEffect(() => {
    if ("storage" in navigator) {
      navigator.storage
        .getDirectory()
        .then((folder) => {
          return listChunks(folder);
        })
        .then((files) => {
          const arr: (string | null)[] = new Array(hashes.length).fill(null);
          for (const file of files) {
            const i = hashes.indexOf(file);
            if (i !== -1) arr[i] = file;
          }
          setDownloaded(arr);
          setVerified(arr);
        });
    }
  }, []);

  useEffect(() => {
    return () => controller?.abort();
  }, []);

  return { download, downloaded, errors, verified, loading };
}
