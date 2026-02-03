import { hexToBytes } from "@noble/hashes/utils";
import { getTagValue, KnownEvent } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export function getArchiveChunkHashes(archive: NostrEvent) {
  const chunks = archive.tags.filter((t) => t[0] === "chunk").map((t) => t[1]);
  return chunks.length > 0
    ? chunks.map(hexToBytes)
    : archive.content
        .trim()
        .split("\n")
        .filter((h) => h.length === 64)
        .map(hexToBytes);
}

export function getArchiveName(archive: NostrEvent) {
  return getTagValue(archive, "name");
}

export function getArchiveSummary(archive: NostrEvent) {
  return archive.content;
}

export function getArchiveMimeType(archive: NostrEvent) {
  return getTagValue(archive, "mime");
}

export function getArchiveSize(archive: NostrEvent) {
  const v = getTagValue(archive, "size");
  return v ? parseInt(v) : undefined;
}

export function getArchiveServers(archive: NostrEvent) {
  return archive.tags.filter((t) => t[0] === "server").map((t) => t[1]);
}

export function isValidArchive(archive: NostrEvent): archive is KnownEvent<2001> {
  if (archive.kind !== 2001) return false;

  try {
    return getArchiveChunkHashes(archive).length > 0;
  } catch (error) {}
  return false;
}
