import { useToast } from "@chakra-ui/react";
import { createUploadAuth } from "blossom-client-sdk";
import { useCallback, useEffect, useState } from "react";

import { EventTemplate, finalizeEvent, generateSecretKey } from "nostr-tools";
import { Chunk } from "../helpers/blob";
import { saveChunk } from "../helpers/storage";
import { uploadChunks } from "../helpers/upload";
import { useWallet } from "../providers/wallet-provider";
import state from "../services/state";
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
        onStart: (server, sha256) => {
          setStarted((v) => ({ ...v, [sha256]: [...(v[sha256] ?? []), server] }));
        },
        onUpload: (server, sha256, chunk) => {
          setUploaded((v) => ({ ...v, [sha256]: [...(v[sha256] ?? []), server] }));
          if (folder) saveChunk(folder, chunk);
        },
        onPayment: async (_server, _blob, _chunk, request) => {
          // optimize the wallet on the first payment
          // if (!optimized) {
          //   optimized = true;
          //   await wallet.optimize(new Array(chunks.length).fill(request.amount));
          // }

          if (!request.amount) throw new Error("Missing amount");
          return await wallet.send(request.amount);
        },
        onAuth: async (_server, sha256) => {
          return await createUploadAuth(signer, sha256);
        },
        onError: (server, sha256, _chunk, error) => {
          setHashError(sha256, server, error);
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
