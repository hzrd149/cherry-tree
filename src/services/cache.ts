import "window.nostrdb.js";

import { Filter, NostrEvent, persistEventsToCache } from "applesauce-core/helpers";
import { eventStore } from "./nostr";

export async function cacheRequest(filters: Filter[]): Promise<NostrEvent[]> {
  return await window.nostrdb.filters(filters);
}

// save all events to cache
persistEventsToCache(eventStore, async (events) => {
  await Promise.allSettled(events.map((event) => window.nostrdb.add(event)));
});
