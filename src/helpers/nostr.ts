import { NostrEvent } from "nostr-tools";

export function getTagValue(event: NostrEvent, name: string) {
  return event.tags.find((t) => t[0] === name && t[1] !== undefined)?.[1];
}

export function getTagValues(event: NostrEvent, name: string) {
  return event.tags.filter((t) => t[0] === name && t[1] !== undefined).map((t) => t[1]);
}
