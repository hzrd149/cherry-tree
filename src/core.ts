import { createRxNostr } from "rx-nostr";
import { verifier } from "rx-nostr-crypto";
import { nip07Signer } from "rx-nostr";
import { EventStore, QueryStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";

import state from "./state";
import cache from "./cache";

export const eventStore = new EventStore();
export const queryStore = new QueryStore(eventStore);

export const rxNostr = createRxNostr({
  verifier,
  signer: nip07Signer(),
});

// send all events to eventStore
rxNostr.createAllEventObservable().subscribe((message) => {
  const event = eventStore.add(message.event, message.from);

  // save the event to cache
  if (!isFromCache(event)) cache.publish(event);
});

// update default relays
rxNostr.setDefaultRelays(state.relays.value);
state.relays.subscribe((relays) => rxNostr.setDefaultRelays(relays));

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.eventStore = eventStore;
  // @ts-expect-error
  window.eventStore = eventStore;
  // @ts-expect-error
  window.rxNostr = rxNostr;
}
