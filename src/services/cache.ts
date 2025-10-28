import "window.nostrdb.js";

import { persistEventsToCache, Filter, NostrEvent, markFromCache } from "applesauce-core/helpers";
import { eventStore } from "./stores";

export async function cacheRequest(filters: Filter[]): Promise<NostrEvent[]> {
  const events = await window.nostrdb.filters(filters);
  for (const event of events) markFromCache(event);
  return events;
}

// save all events to cache
persistEventsToCache(eventStore, async (events) => {
  await Promise.allSettled(events.map((event) => window.nostrdb.add(event)));
});
