import { useEffect, useMemo } from "react";
import { useEventStore } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import { Filter } from "nostr-tools";
import { createTimelineLoader } from "applesauce-loaders/loaders";

import { cacheRequest } from "../services/cache";
import pool from "../services/nostr";

export default function useTimeline(relays?: string[], filters?: Filter | Filter[]) {
  const eventStore = useEventStore();
  const loader = useMemo(() => {
    if (!relays || !filters) return;

    console.log("Creating timeline", relays, filters);

    return createTimelineLoader(pool, relays, filters, { cache: cacheRequest, eventStore });
  }, [hash_sum(filters), relays?.join("|")]);

  useEffect(() => {
    if (!loader) return;

    // Load first chunk
    loader().subscribe();
  }, [loader]);

  return loader;
}
