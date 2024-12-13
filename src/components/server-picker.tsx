import { useState, FormEventHandler, useEffect } from "react";
import { Button, CloseButton, Flex, Icon, Input, Link, Text, Tooltip } from "@chakra-ui/react";
import Favicon from "./media-server-favicon";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { getPaymentRequestFromHeaders, PaymentRequest } from "blossom-client-sdk";
import { useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";
import { getTagValue } from "applesauce-core/helpers";

import { SERVER_ADVERTIZEMENT_KIND } from "../const";
import useSubscription from "../hooks/use-subscription";

function AddServerForm({ onSubmit }: { onSubmit: (server: string) => void }) {
  const [server, setServer] = useState("");

  useSubscription("servers", {
    kinds: [SERVER_ADVERTIZEMENT_KIND],
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (server.trim()) onSubmit(server);
    setServer("");
  };

  const servers = useStoreQuery(TimelineQuery, [{ kinds: [SERVER_ADVERTIZEMENT_KIND] }]);
  const serversSuggestions =
    new Set(servers?.map((event) => getTagValue(event, "d")).filter((url) => !!url) as string[]) ?? [];

  return (
    <Flex as="form" onSubmit={handleSubmit} gap="2">
      <Input
        type="url"
        value={server}
        onChange={(e) => setServer(e.target.value)}
        required
        placeholder="https://nostr.download"
        name="server"
        list="server-suggestions"
      />

      <datalist id="server-suggestions">
        {Array.from(serversSuggestions).map((url) => (
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

function ServerCard({ server, onRemove, priceCheck }: { server: string; onRemove: () => void; priceCheck?: string }) {
  const [status, setStatus] = useState<"checking" | "failed">();
  const [payment, setPayment] = useState<PaymentRequest | "free">();
  const [auth, setAuth] = useState<boolean>();

  useEffect(() => {
    if (priceCheck) {
      setStatus("checking");
      fetch(new URL(priceCheck, server), { method: "HEAD" })
        .then((res) => {
          if (res.status === 401) {
            setAuth(true);
          } else if (res.status === 402) {
            const request = getPaymentRequestFromHeaders(res.headers);
            setPayment(request);
          }
          if (res.status >= 200 && res.status < 300) setPayment("free");
          setStatus(undefined);
        })
        .catch(() => {
          setStatus("failed");
        });
    }
  }, []);

  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth="1px" borderRadius="lg" key={server.toString()}>
      <Favicon host={server.toString()} size="sm" />
      <Flex direction="column" lineHeight={1} gap="1">
        <Link href={server.toString()} target="_blank" fontSize="lg">
          {new URL(server).toString()}
        </Link>
        {payment && payment !== "free" && (
          <Text fontSize="sm">
            {payment.amount}
            {payment.unit}/Mb
          </Text>
        )}

        {status === "checking" && <Text color="blue.500">Checking...</Text>}
        {status === "failed" && <Text color="red.500">Failed</Text>}
        {payment === "free" && <Text color="green.500">Free!</Text>}
      </Flex>
      {auth !== undefined ? (
        <Tooltip label={auth ? "Auth Required" : "No Auth"}>
          <Icon as={auth ? FiEye : FiEyeOff} color={auth ? "purple.500" : "green.500"} />
        </Tooltip>
      ) : null}

      <CloseButton ml="auto" onClick={onRemove} />
    </Flex>
  );
}

export default function ServerPicker({
  servers,
  onChange,
  priceCheck,
}: {
  servers: string[];
  onChange: (servers: string[]) => void;
  priceCheck?: string;
}) {
  return (
    <>
      {servers.length > 0 && (
        <Flex direction="column" gap="2">
          {servers.map((server) => (
            <ServerCard
              key={server}
              server={server}
              onRemove={() => onChange(servers.filter((s) => s !== server))}
              priceCheck={priceCheck}
            />
          ))}
        </Flex>
      )}
      <AddServerForm onSubmit={(server) => onChange([...servers, server])} />

      <Text color="GrayText" fontSize="sm">
        Find more servers at{" "}
        <Link href="https://blossomservers.com" isExternal color="blue.500">
          blossomservers.com
        </Link>
      </Text>
    </>
  );
}
