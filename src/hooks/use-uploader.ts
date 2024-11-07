import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { useWallet } from "../providers/wallet-provider";
import { Chunk } from "../helpers/blob";
import { EventTemplate, finalizeEvent, generateSecretKey } from "nostr-tools";
import { uploadChunks } from "../helpers/upload";
import state from "../state";
import { createUploadAuth } from "../helpers/blossom";
import { saveChunk } from "../helpers/storage";
import useErrorRecords from "./use-error-record";

export default function useUploader(servers: string[], chunks: Chunk[], anon: boolean, persist = true) {
  const toast = useToast();
  const wallet = useWallet();
  const [tempKey] = useState(() => generateSecretKey());
  const [controller, setController] = useState<AbortController>();

  const [error, setError] = useState<Error>();
  const [started, setStarted] = useState<Record<string, string[]>>({});
  const [uploaded, setUploaded] = useState<Record<string, string[]>>({});
  const [errors, setHashError, resetErrors] = useErrorRecords();

  const signer = useCallback(
    async (draft: EventTemplate) => {
      if (anon) return finalizeEvent(draft, tempKey);
      else if (window.nostr) return window.nostr?.signEvent(draft);
      else throw new Error("Missing signer");
    },
    [anon, tempKey],
  );

  const [loading, setLoading] = useState(false);
  const upload = async () => {
    try {
      setLoading(true);
      setError(undefined);
      setStarted({});
      setUploaded({});
      resetErrors();
      const controller = new AbortController();
      setController(controller);

      // let optimized = false;
      const folder = persist && "storage" in navigator ? await navigator.storage.getDirectory() : undefined;
      await uploadChunks(servers, chunks, {
        signal: controller.signal,
        parallel: state.uploaders.value,
        onStart: (server, chunk) => {
          setStarted((v) => ({ ...v, [chunk.hash]: [...(v[chunk.hash] ?? []), server] }));
        },
        onUpload: (server, chunk) => {
          setUploaded((v) => ({ ...v, [chunk.hash]: [...(v[chunk.hash] ?? []), server] }));
          if (folder) saveChunk(folder, chunk);
        },
        onPayment: async (_server, _blob, request) => {
          // optimize the wallet on the first payment
          // if (!optimized) {
          //   optimized = true;
          //   await wallet.optimize(new Array(chunks.length).fill(request.amount));
          // }

          return await wallet.send(request.amount, { pubkey: request.pubkey });
        },
        onAuth: async (_server, blob) => {
          return await createUploadAuth(typeof blob === "string" ? blob : blob.hash, signer);
        },
        onError: (server, chunk, error) => {
          setHashError(chunk.hash, server, error);
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
        toast({ status: "error", description: error.message });
      }
    }
    setLoading(false);
  };

  // stop upload on unmount
  useEffect(() => {
    return () => controller?.abort();
  }, [controller]);

  return { upload, loading, errors, uploaded, started, error };
}
