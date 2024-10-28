import { useState, FormEventHandler, useEffect } from "react";
import { Button, CloseButton, Flex, Input, Link } from "@chakra-ui/react";
import { Filter } from "nostr-tools";

import Favicon from "./media-server-favicon";
import { relayPool } from "../pool";
import { getTagValue } from "../helpers/nostr";
import state, { addRelayEvent } from "../state";
import { useObservable } from "../hooks/use-observable";

const onlineFilter: Filter = {
  kinds: [30166],
  "#n": ["clearnet"],
  since: Math.round(Date.now() / 1000) - 60 * 60_000,
};

function AddRelayForm({ onSubmit }: { onSubmit: (relay: string) => void }) {
  const [relay, setRelay] = useState("");
  const online = useObservable(state.onlineRelays);

  // fetch online relays
  useEffect(() => {
    if (state.onlineRelays.value.length > 0) return;

    const sub = relayPool.subscribeMany(["wss://relay.nostr.watch/"], [onlineFilter], {
      onevent: (event) => addRelayEvent(event),
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
