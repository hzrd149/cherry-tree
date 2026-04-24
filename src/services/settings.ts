import { safeParse } from "applesauce-core/helpers";
import { BehaviorSubject } from "rxjs";

import { DEFAULT_RELAYS, LOOKUP_RELAYS } from "../const";

export type BlobStorageBackend = "browser" | "local-blossom";

function parseBlobStorageBackend(value: string | null): BlobStorageBackend {
  return value === "local-blossom" ? "local-blossom" : "browser";
}

// load settings from local storage
const defaultRelays = new BehaviorSubject<string[]>(safeParse(localStorage.relay) ?? DEFAULT_RELAYS);
const lookupRelays = new BehaviorSubject<string[]>(safeParse(localStorage.lookup) ?? LOOKUP_RELAYS);
const defaultServers = new BehaviorSubject<string[]>(safeParse(localStorage.servers) ?? []);
const blobStorageBackend = new BehaviorSubject<BlobStorageBackend>(
  parseBlobStorageBackend(localStorage.getItem("blobStorageBackend")),
);

// save changes
defaultRelays.subscribe((arr) => (localStorage.relays = JSON.stringify(arr)));
lookupRelays.subscribe((arr) => (localStorage.lookup = JSON.stringify(arr)));
defaultServers.subscribe((arr) => (localStorage.servers = JSON.stringify(arr)));
blobStorageBackend.subscribe((backend) => localStorage.setItem("blobStorageBackend", backend));

export { lookupRelays, defaultRelays, defaultServers, blobStorageBackend };
