import { safeParse } from "applesauce-core/helpers";
import { BehaviorSubject } from "rxjs";

import { DEFAULT_RELAYS, LOOKUP_RELAYS } from "../const";

// load settings from local storage
const defaultRelays = new BehaviorSubject<string[]>(safeParse(localStorage.relay) ?? DEFAULT_RELAYS);
const lookupRelays = new BehaviorSubject<string[]>(safeParse(localStorage.lookup) ?? LOOKUP_RELAYS);
const defaultServers = new BehaviorSubject<string[]>(safeParse(localStorage.servers) ?? []);

// save changes
defaultRelays.subscribe((arr) => (localStorage.relays = JSON.stringify(arr)));
lookupRelays.subscribe((arr) => (localStorage.lookup = JSON.stringify(arr)));
defaultServers.subscribe((arr) => (localStorage.servers = JSON.stringify(arr)));

export { lookupRelays, defaultRelays, defaultServers };
