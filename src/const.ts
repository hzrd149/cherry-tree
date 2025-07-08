import { mergeRelaySets } from "applesauce-core/helpers";

const mb = 1024 * 1024;

export const CHUNK_SIZE_LARGE = 4 * mb;
export const CHUNK_SIZE_SMALL = mb;

export const SERVER_ADVERTIZEMENT_KIND = 36363;

export const DEFAULT_RELAYS = mergeRelaySets([
  "wss://relay.damus.io/",
  "wss://nos.lol/",
  "wss://relay.primal.net/",
  "wss://nostrue.com/",
]);

export const LOOKUP_RELAYS = mergeRelaySets(["wss://purplepag.es/"]);
