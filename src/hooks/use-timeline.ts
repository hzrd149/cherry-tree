import { useEffect, useMemo } from "react";
import { TimelineLoader } from "applesauce-loaders";
import { useEventStore } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import { Filter } from "nostr-tools";

import rxNostr from "../services/rx-nostr";
import { cacheRequest } from "../services/cache";

export default function useTimeline(relays?: string[], filters?: Filter | Filter[]) {
  const eventStore = useEventStore();
  const timeline = useMemo(() => {
    if (!relays || !filters) return;

    console.log("Creating timeline", relays, filters);

    return new TimelineLoader(
      rxNostr,
      TimelineLoader.simpleFilterMap(relays, Array.isArray(filters) ? filters : [filters]),
      { cacheRequest },
    );
  }, [hash_sum(filters), relays?.join("|")]);

  useEffect(() => {
    // wait till timeline and event store are created
    if (!timeline) return;

    const sub = timeline.subscribe((packet) => {
      eventStore.add(packet.event, packet.from);
    });

    // load next chunk when hook mounts
    timeline.next(-Infinity);

    return () => sub.unsubscribe();
  }, [eventStore, timeline]);

  return timeline;
}
