import { EventStore } from "applesauce-core/event-store";
import { createAddressLoader, createEventLoader } from "applesauce-loaders/loaders";
import { createEventLoaderForStore } from "applesauce-loaders/loaders/unified-event-loader";
import { RelayPool } from "applesauce-relay";

import { cacheRequest } from "./cache";
import { lookupRelays } from "./settings";

// Create relay pool
export const pool = new RelayPool();

// Create event store (single instance recommended)
export const eventStore = new EventStore();

// Create and assign unified event loader to store
// This handles both events by ID and addressable events automatically
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  bufferTime: 500,
  lookupRelays,
});

// Export individual loaders for specific use cases
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

// Export pool as default for backwards compatibility
export default pool;
