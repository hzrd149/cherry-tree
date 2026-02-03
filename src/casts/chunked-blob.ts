import { bytesToHex } from "@noble/hashes/utils";
import { CastRefEventStore, EventCast } from "applesauce-common/casts/cast";
import { getTagValue, KnownEvent, NostrEvent } from "applesauce-core/helpers";
import {
  getArchiveChunkHashes,
  getArchiveMimeType,
  getArchiveName,
  getArchiveServers,
  getArchiveSize,
  isValidArchive,
} from "../helpers/archive";

/**
 * ChunkedBlob cast class for kind 2001 events
 * Represents a large blob that has been chunked for distribution across Blossom servers
 */
export class ChunkedBlob extends EventCast<KnownEvent<2001>> {
  constructor(event: NostrEvent, store: CastRefEventStore) {
    // Validate event kind BEFORE calling super
    if (!isValidArchive(event)) throw new Error("ChunkedBlob: missing chunk tags");

    super(event, store);
  }

  // Synchronous properties - extracted from event tags/content

  /** Filename from "name" tag */
  get filename(): string | undefined {
    return getArchiveName(this.event);
  }

  /** MIME type from "mime" tag */
  get mimeType(): string | undefined {
    return getArchiveMimeType(this.event);
  }

  /** Total file size in bytes from "size" tag */
  get size(): number | undefined {
    return getArchiveSize(this.event);
  }

  /** Root hash from "x" tag */
  get rootHash(): string | undefined {
    return getTagValue(this.event, "x");
  }

  /** Human-readable description from content field */
  get summary(): string {
    return this.event.content;
  }

  /** Array of chunk hashes (hex strings) from "chunk" tags */
  get chunkHashes(): string[] {
    return getArchiveChunkHashes(this.event).map(bytesToHex);
  }

  /** Array of chunk hashes as Uint8Array for hashing operations */
  get chunkHashesBytes(): Uint8Array[] {
    return getArchiveChunkHashes(this.event);
  }

  /** Recommended Blossom servers from "server" tags */
  get servers(): string[] {
    return getArchiveServers(this.event);
  }

  /** Number of chunks */
  get chunkCount(): number {
    return this.chunkHashes.length;
  }

  /** Validate that this chunked blob has at least one chunk */
  get isValid(): boolean {
    try {
      return this.chunkHashesBytes.length > 0;
    } catch {
      return false;
    }
  }
}
