import { BehaviorSubject } from "rxjs";
import { MerkleNode } from "./helpers/merkle";
import { nanoid } from "nanoid";
import { Chunk } from "./helpers/blob";
import { NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { getTagValue } from "./helpers/nostr";

export type ChunkedFile = {
  id: string;
  file: File;
  chunks?: Chunk[];
  tree?: MerkleNode;
};

const files = new BehaviorSubject<ChunkedFile[]>([]);
const servers = new BehaviorSubject<string[]>(JSON.parse(localStorage.getItem("servers") ?? "[]"));
servers.subscribe((servers) => {
  localStorage.setItem("servers", JSON.stringify(servers));
});
const relays = new BehaviorSubject<string[]>(JSON.parse(localStorage.getItem("relays") ?? "[]"));
relays.subscribe((relays) => {
  localStorage.setItem("relays", JSON.stringify(relays));
});
const archives = new BehaviorSubject<NostrEvent[]>([]);
const onlineRelays = new BehaviorSubject<NostrEvent[]>([]);

const downloaders = new BehaviorSubject(5);
const uploaders = new BehaviorSubject(5);

const state = {
  files,
  servers,
  relays,
  archives,
  onlineRelays,
  downloaders,
  uploaders,
};

export function addFiles(files: File[]) {
  const chunkedFiles = files.map((file) => ({ file, id: nanoid() }));
  state.files.next([...state.files.value, ...chunkedFiles]);
  return chunkedFiles;
}
export function removeFile(id: string) {
  files.next(files.value.filter((f) => f.id !== id));
}
export function updateFile(id: string, update: Partial<ChunkedFile>) {
  state.files.next(
    state.files.value.map((file) => {
      if (file.id === id) {
        return { ...file, ...update };
      } else return file;
    }),
  );
}

export function addArchiveEvent(event: NostrEvent) {
  if (state.archives.value.some((e) => e.id === event.id)) return;

  const events = Array.from(state.archives.value);
  insertEventIntoDescendingList(events, event);
  state.archives.next(events);
}
export function addRelayEvent(event: NostrEvent) {
  if (state.onlineRelays.value.some((e) => getTagValue(e, "d") === getTagValue(event, "d"))) return;

  const events = Array.from(state.onlineRelays.value);
  insertEventIntoDescendingList(events, event);
  state.onlineRelays.next(events);
}

export default state;
