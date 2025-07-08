import { createAddressLoader, createEventLoader } from "applesauce-loaders/loaders";

import { cacheRequest } from "./cache";
import { lookupRelays } from "./settings";
import { eventStore } from "./stores";

import pool from "./pool";

export const addressLoader = createAddressLoader(pool, {
  cacheRequest,
  bufferTime: 500,
  lookupRelays,
  eventStore,
});

export const singleEventLoader = createEventLoader(pool, {
  cacheRequest,
  bufferTime: 500,
  eventStore,
});
