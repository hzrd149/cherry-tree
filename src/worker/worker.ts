import { WorkerTask, WorkerResult } from "./types.ts";

import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

self.onmessage = async (e: MessageEvent<WorkerTask>) => {
  const { blob, index, id } = e.data;

  let hash: string;
  if (typeof crypto !== "undefined" && "subtle" in crypto && typeof crypto.subtle.digest === "function") {
    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();
    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    const data = new Uint8Array(await blob.arrayBuffer());
    hash = bytesToHex(sha256(data));
  }

  const result: WorkerResult = { id, hash, index };
  self.postMessage(result);
};
