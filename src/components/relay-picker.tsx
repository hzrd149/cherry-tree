import { useState, FormEventHandler, useEffect } from "react";
import { Button, CloseButton, Flex, Input, Link } from "@chakra-ui/react";
import { useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";
import { getTagValue } from "applesauce-core/helpers";
import { Filter } from "nostr-tools";

import Favicon from "./media-server-favicon";
import { relayPool } from "../pool";
import { eventStore } from "../state";

const onlineFilter: Filter = {
  kinds: [30166],
  "#n": ["clearnet"],
  since: Math.round(Date.now() / 1000) - 60 * 60_000,
};

let loaded = false;

function AddRelayForm({ onSubmit }: { onSubmit: (relay: string) => void }) {
  const [relay, setRelay] = useState("");
  const online = useStoreQuery(TimelineQuery, [onlineFilter]);

  // fetch online relays
  useEffect(() => {
    if (loaded) return;
    loaded = true;

    const sub = relayPool.subscribeMany(["wss://relay.nostr.watch/"], [onlineFilter], {
      onevent: (event) => eventStore.add(event),
    });

    return () => sub.close();
  }, []);

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (relay.trim()) onSubmit(relay);
    setRelay("");
  };

  const relaySuggestions =
    new Set(online?.map((event) => getTagValue(event, "d")).filter((url) => !!url) as string[]) ?? [];

  return (
    <Flex as="form" onSubmit={handleSubmit} gap="2">
      <Input
        type="url"
        value={relay}
        onChange={(e) => setRelay(e.target.value)}
        required
        placeholder="wss://relay.example.com"
        name="relay"
        list="relay-suggestions"
      />

      <datalist id="relay-suggestions">
        {Array.from(relaySuggestions).map((url) => (
          <option key={url} value={url}>
            {url}
          </option>
        ))}
      </datalist>
      <Button type="submit" colorScheme="pink">
        Add
      </Button>
    </Flex>
  );
}

function RelayCard({ relay, onRemove }: { relay: string; onRemove: () => void }) {
  const httpUrl = new URL(relay);
  httpUrl.protocol = httpUrl.protocol === "wss:" ? "https:" : "http:";

  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth="1px" borderRadius="lg" key={relay.toString()}>
      <Favicon host={httpUrl.toString()} size="sm" />
      <Link href={httpUrl.toString()} target="_blank" fontSize="lg">
        {new URL(relay).toString()}
      </Link>

      <CloseButton ml="auto" onClick={onRemove} />
    </Flex>
  );
}

export default function RelayPicker({ relays, onChange }: { relays: string[]; onChange: (relays: string[]) => void }) {
  return (
    <>
      <Flex direction="column" gap="2">
        {relays.map((relay) => (
          <RelayCard
            relay={relay}
            key={relay.toString()}
            onRemove={() => onChange(relays.filter((s) => s !== relay))}
          />
        ))}
      </Flex>
      <AddRelayForm onSubmit={(relay) => onChange([...relays, relay])} />
    </>
  );
}
