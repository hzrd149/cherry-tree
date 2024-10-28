import { Box, Button, Code, Flex, Heading, Spinner, Switch, Text, Tooltip, useDisclosure } from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bytesToHex } from "@noble/hashes/utils";

import { relayPool } from "../../pool";
import state, { addArchiveEvent } from "../../state";
import { decodeTree, getLeafNodes } from "../../helpers/merkle";
import { base64ToBytes } from "../../helpers/base64";
import MerkleTreeButton from "../../components/merkle-tree-button";
import ServerPicker from "../../components/server-picker";
import { getTagValue } from "../../helpers/nostr";
import { useObservable } from "../../hooks/use-observable";
import { CopyButton } from "../../components/copy-button";
import useDownloader from "../../hooks/use-downloader";

function ArchiveDownloadPage({ archive, nevent }: { archive: NostrEvent; nevent: string }) {
  const title = getTagValue(archive, "title");
  const type = getTagValue(archive, "m");
  const summary = getTagValue(archive, "summary");
  const root = getTagValue(archive, "x");
  const persist = useDisclosure({ defaultIsOpen: !!navigator.storage });

  const tree = useMemo(() => decodeTree(base64ToBytes(archive.content)), [archive]);
  const hashes = useMemo(() => getLeafNodes(tree).map((c) => bytesToHex(c.hash)), [tree]);
  const [servers, setServers] = useState<string[]>(() =>
    Array.from(
      new Set([...state.servers.value, ...archive.tags.filter((t) => t[0] === "server" && t[1]).map((t) => t[1])]),
    ),
  );

  const { download, downloaded, verified, loading, errors } = useDownloader(servers, hashes, {
    name: title,
    type,
    persist: persist.isOpen,
  });

  const useCustomServers = () => setServers([...state.servers.value]);

  return (
    <Flex gap="2" direction="column">
      <Box>
        <CopyButton float="right" size="sm" value={nevent} aria-label="Copy link" variant="ghost" />
        <Heading size="md">{title || archive.id.slice(0, 8)}</Heading>
      </Box>
      {summary && <Text whiteSpace="pre-line">{summary}</Text>}
      <Flex gap="2" justifyContent="space-between">
        <Heading size="sm">Merkle Tree</Heading>
        <MerkleTreeButton variant="link" tree={tree}>
          details
        </MerkleTreeButton>
      </Flex>
      <Code fontFamily="monospace" userSelect="all">
        {root}
      </Code>

      <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
        <Heading size="md">Servers</Heading>
        <Button variant="link" onClick={useCustomServers}>
          Use custom
        </Button>
      </Flex>
      <ServerPicker servers={servers} onChange={setServers} priceCheck={hashes[0]} />

      <Flex gap="2" mt="2" alignItems="flex-end">
        <Heading size="sm" flex={1}>
          Chunks: {hashes.length}
        </Heading>
        {downloaded.length > 0 && (
          <Button variant="link" as={Link} to={`/archive/${nevent}/upload`}>
            Upload
          </Button>
        )}
        <Switch size="sm" isChecked={persist.isOpen} onChange={persist.onToggle}>
          Persist
        </Switch>
      </Flex>
      <Flex gap="2px" wrap="wrap" p="1" borderWidth="1px" rounded="sm">
        {hashes.map((hash) => (
          <Tooltip key={hash} label={`${hash.slice(0, 8)}`}>
            <Box
              w="4"
              h="4"
              bg={
                verified.includes(hash)
                  ? "green.500"
                  : downloaded.includes(hash)
                    ? "blue.500"
                    : errors[hash]
                      ? "red.500"
                      : "gray.500"
              }
            />
          </Tooltip>
        ))}
      </Flex>

      <Button
        colorScheme="green"
        size="lg"
        w="full"
        isLoading={loading}
        onClick={download}
        isDisabled={servers.length === 0}
      >
        Download
      </Button>
    </Flex>
  );
}

export default function ArchiveDownloadView() {
  const { nevent } = useParams();
  if (!nevent) throw new Error("Missing nevent");
  const decoded = nip19.decode(nevent);
  if (decoded.type !== "nevent") throw new Error(`Unsupported ${decoded.type}`);

  const relays = useObservable(state.relays);
  const events = useObservable(state.archives);
  const event = events.find((e) => e.id === decoded.data.id);

  // load event
  useEffect(() => {
    relayPool
      .get([...relays, ...(decoded.data.relays ?? [])], { ids: [decoded.data.id] })
      .then((event) => event && addArchiveEvent(event));
  }, [decoded]);

  if (!event) return <Spinner />;
  return <ArchiveDownloadPage archive={event} nevent={nevent} />;
}
