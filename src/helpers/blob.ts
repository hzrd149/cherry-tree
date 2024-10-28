import { sha256 } from "@noble/hashes/sha256";
import { CHUNK_SIZE_LARGE, CHUNK_SIZE_SMALL } from "../const";
import { buildMerkleTree } from "./merkle";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import BlobHasher from "../worker/hasher";

export function splitBlob(blob: Blob, chunkSize: number) {
  if (chunkSize <= 0) throw new Error("Chunk size must be greater than 0");
  if (chunkSize > blob.size) return [blob];

  const chunks: Blob[] = [];

  // Calculate the number of chunks needed
  const chunksCount = Math.ceil(blob.size / chunkSize);

  // Split  the blob into chunks
  for (let i = 0; i < chunksCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, blob.size);

    // Slice the blob into a chunk
    const chunk = blob.slice(start, end);
    chunks.push(chunk);
  }

  return chunks;
}

export interface Chunk extends Blob {
  hash: string;
  index: number;
}

export type ChunkHandlers = {
  onChunk?: (chunk: Chunk) => void;
};

export async function chunkFile(file: File, chunkSize: "small" | "large", handlers?: ChunkHandlers) {
  const size = chunkSize === "large" ? CHUNK_SIZE_LARGE : CHUNK_SIZE_SMALL;

  console.time("chunk");
  const blobs = splitBlob(file, size);
  console.timeEnd("chunk");

  let chunks: Chunk[];
  let hashes: Uint8Array[];

  console.time("sha256");
  try {
    const hasher = new BlobHasher();
    if (handlers?.onChunk) hasher.onChunk = handlers?.onChunk;
    chunks = await Promise.all(blobs.map((b, i) => hasher.addToQueue(b, i)));
    await hasher.waitForComplete();
    hashes = chunks.map((c) => hexToBytes(c.hash));
  } catch (error) {
    console.log(`Failed to use web workers`);

    chunks = [];
    hashes = [];
    for (let index = 0; index < blobs.length; index++) {
      const blob = blobs[index];

      const data = new Uint8Array(await blob.arrayBuffer());
      const hash = sha256(data);

      const chunk = blob as Chunk;
      chunk.hash = bytesToHex(hash);
      chunk.index = index;

      hashes.push(hash);
      chunks.push(chunk);

      handlers?.onChunk?.(chunk);
    }
  }
  console.timeEnd("sha256");

  console.time("merkle");
  const tree = buildMerkleTree(hashes.map((hash) => ({ hash })));
  console.timeEnd("merkle");

  return { tree, chunks };
}

export async function concatBlobs(blobs: Blob[]): Promise<Blob> {
  // Convert blobs to ArrayBuffers
  const arrayBuffers = await Promise.all(blobs.map((blob) => blob.arrayBuffer()));

  // Concatenate ArrayBuffers
  const totalLength = arrayBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  arrayBuffers.forEach((buffer) => {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });

  return new Blob([result], { type: blobs[0].type });
}
