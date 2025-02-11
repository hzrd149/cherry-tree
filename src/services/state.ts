import { BehaviorSubject } from "rxjs";
import { nanoid } from "nanoid";

import { Chunk } from "../helpers/blob";
import { defaultRelays, defaultServers } from "./settings";

export type ChunkedFile = {
  id: string;
  file: File;
  chunks?: Chunk[];
};

const files = new BehaviorSubject<ChunkedFile[]>([]);
const servers = defaultServers;
const relays = defaultRelays;

const downloaders = new BehaviorSubject(parseInt(localStorage.getItem("downloaders") ?? "5"));
downloaders.subscribe((c) => localStorage.setItem("downloaders", String(c)));

const uploaders = new BehaviorSubject(parseInt(localStorage.getItem("uploaders") ?? "5"));
uploaders.subscribe((c) => localStorage.setItem("uploaders", String(c)));

const state = {
  files,
  servers,
  relays,
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

export default state;
