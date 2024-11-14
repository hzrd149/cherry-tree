import { Box, Button, Code, Flex, Heading, Spinner, Switch, Text, Tooltip, useDisclosure } from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useObservable, useStoreQuery } from "applesauce-react/hooks";
import { SingleEventQuery } from "applesauce-core/queries";
import { getTagValue } from "applesauce-core/helpers";
import { bytesToHex } from "@noble/hashes/utils";

import { relayPool } from "../../pool";
import state, { eventStore } from "../../state";
import ServerPicker from "../../components/server-picker";
import { CopyButton } from "../../components/copy-button";
import useDownloader from "../../hooks/use-downloader";
import {
  getArchiveChunkHashes,
  getArchiveMimeType,
  getArchiveName,
  getArchiveSummary,
  isValidArchive,
} from "../../helpers/archive";

function ArchiveDownloadPage({ archive, nevent }: { archive: NostrEvent; nevent: string }) {
  const name = getArchiveName(archive);
  const type = getArchiveMimeType(archive);
  const summary = getArchiveSummary(archive);
  const root = getTagValue(archive, "x");
  const hashes = useMemo(() => getArchiveChunkHashes(archive).map(bytesToHex), [archive]);

  const persist = useDisclosure({ defaultIsOpen: "storage" in navigator });

  const [servers, setServers] = useState<string[]>(() =>
    Array.from(
      new Set([...state.servers.value, ...archive.tags.filter((t) => t[0] === "server" && t[1]).map((t) => t[1])]),
    ),
  );

  const { download, downloaded, verified, loading, errors } = useDownloader(servers, hashes, {
    name: name,
    type,
    persist: persist.isOpen,
  });

  const useCustomServers = () => setServers([...state.servers.value]);

  return (
    <Flex gap="2" direction="column">
      <Box>
        <CopyButton float="right" size="sm" value={nevent} aria-label="Copy link" variant="ghost" />
        <Heading size="md">{name || archive.id.slice(0, 8)}</Heading>
      </Box>
      {summary && <Text whiteSpace="pre-line">{summary}</Text>}

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
      <Heading size="sm">Root hash</Heading>
      <Code fontFamily="monospace" userSelect="all">
        {root}
      </Code>

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
  const archive = useStoreQuery(SingleEventQuery, [decoded.data.id]);
  if (archive && !isValidArchive(archive)) throw new Error("Invalid archive event");

  // load event
  useEffect(() => {
    if (archive) return;

    relayPool
      .get([...relays, ...(decoded.data.relays ?? [])], { ids: [decoded.data.id] })
      .then((event) => event && eventStore.add(event));
  }, [decoded, archive]);

  if (!archive) return <Spinner />;
  return <ArchiveDownloadPage archive={archive} nevent={nevent} />;
}
