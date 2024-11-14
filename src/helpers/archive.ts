import { hexToBytes } from "@noble/hashes/utils";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export function getArchiveChunkHashes(archive: NostrEvent) {
  return archive.content.trim().split("\n").map(hexToBytes);
}

export function getArchiveName(archive: NostrEvent) {
  return getTagValue(archive, "name");
}

export function getArchiveSummary(archive: NostrEvent) {
  return getTagValue(archive, "summary");
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

export function isValidArchive(archive: NostrEvent) {
  try {
    getArchiveChunkHashes(archive);
    return true;
  } catch (error) {}
  return false;
}
