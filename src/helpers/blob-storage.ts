import { bytesToHex } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { uploadBlob } from "blossom-client-sdk/actions/upload";

import { Chunk } from "./blob";
import { hasChunk, readChunk, saveChunk } from "./storage";
import { blobStorageBackend, BlobStorageBackend } from "../services/settings";

export const LOCAL_BLOSSOM_CACHE_URL = "http://127.0.0.1:24242";

export type LocalBlossomCacheStatus = "unavailable" | "available-readonly" | "available-writable";

export async function detectLocalBlossomCache(signal?: AbortSignal) {
  try {
    const res = await fetch(LOCAL_BLOSSOM_CACHE_URL, { method: "HEAD", signal });
    return res.ok;
  } catch (error) {
    return false;
  }
}

async function getDummyBlob() {
  const blob = new Blob(["cherry-tree-local-cache-test"], { type: "text/plain" });
  const hash = bytesToHex(sha256(new Uint8Array(await blob.arrayBuffer())));
  return { blob, hash };
}

export async function testLocalBlossomUpload(signal?: AbortSignal) {
  const { blob, hash } = await getDummyBlob();
  await uploadBlob(LOCAL_BLOSSOM_CACHE_URL, blob, { auth: false, signal, timeout: 3000 });

  const res = await fetch(new URL(hash, LOCAL_BLOSSOM_CACHE_URL), { method: "HEAD", signal });
  if (!res.ok) throw new Error("Local Blossom cache accepted upload but did not store the test blob");
}

export async function checkLocalBlossomCache(signal?: AbortSignal): Promise<LocalBlossomCacheStatus> {
  const available = await detectLocalBlossomCache(signal);
  if (!available) return "unavailable";

  try {
    await testLocalBlossomUpload(signal);
    return "available-writable";
  } catch (error) {
    return "available-readonly";
  }
}

export async function saveChunkToLocalBlossom(chunk: Chunk, signal?: AbortSignal) {
  await uploadBlob(LOCAL_BLOSSOM_CACHE_URL, chunk, { auth: false, signal, timeout: 3000 });
}

export async function hasChunkInLocalBlossom(hash: string, signal?: AbortSignal) {
  const res = await fetch(new URL(hash, LOCAL_BLOSSOM_CACHE_URL), { method: "HEAD", signal });
  return res.ok;
}

export async function readChunkFromLocalBlossom(hash: string, index: number, signal?: AbortSignal) {
  const res = await fetch(new URL(hash, LOCAL_BLOSSOM_CACHE_URL), { signal });
  if (!res.ok) throw new Error(`Local Blossom cache missing ${hash}`);

  const chunk = (await res.blob()) as Chunk;
  chunk.hash = hash;
  chunk.index = index;
  return chunk;
}

export async function downloadBlobFromLocalBlossomCache(hash: string, servers: string[], signal?: AbortSignal) {
  const url = new URL(hash, LOCAL_BLOSSOM_CACHE_URL);
  for (const server of servers) url.searchParams.append("xs", server);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Local Blossom cache failed to fetch ${hash}`);
  return await res.blob();
}

export async function getBrowserStorageFolder() {
  if (!("storage" in navigator)) return undefined;
  return await navigator.storage.getDirectory();
}

export async function saveChunkToBrowserStorage(chunk: Chunk) {
  const folder = await getBrowserStorageFolder();
  if (folder) await saveChunk(folder, chunk);
}

export async function readChunkFromBrowserStorage(hash: string, index: number) {
  const folder = await getBrowserStorageFolder();
  if (!folder) throw new Error("Browser storage is not available");
  return await readChunk(folder, hash, index);
}

export async function hasChunkInBrowserStorage(hash: string) {
  const folder = await getBrowserStorageFolder();
  if (!folder) return false;
  return await hasChunk(folder, hash);
}

export async function saveChunkToSelectedStorage(chunk: Chunk, signal?: AbortSignal) {
  if (blobStorageBackend.value === "local-blossom") {
    try {
      await saveChunkToLocalBlossom(chunk, signal);
      return;
    } catch (error) {}
  }

  await saveChunkToBrowserStorage(chunk);
}

export async function readChunkFromSelectedStorage(hash: string, index: number, signal?: AbortSignal) {
  if (blobStorageBackend.value === "local-blossom") {
    try {
      return await readChunkFromLocalBlossom(hash, index, signal);
    } catch (error) {}
  }

  return await readChunkFromBrowserStorage(hash, index);
}

export async function hasChunkInSelectedStorage(hash: string, signal?: AbortSignal) {
  if (blobStorageBackend.value === "local-blossom") {
    try {
      if (await hasChunkInLocalBlossom(hash, signal)) return true;
    } catch (error) {}
  }

  return await hasChunkInBrowserStorage(hash);
}

export function getSelectedBlobStorageBackend(): BlobStorageBackend {
  return blobStorageBackend.value;
}
