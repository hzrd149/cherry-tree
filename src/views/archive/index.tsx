import {
  Box,
  Button,
  ButtonGroup,
  Code,
  Flex,
  Heading,
  Icon,
  IconButton,
  Spinner,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { bytesToHex } from "@noble/hashes/utils";
import { getTagValue } from "applesauce-core/helpers";
import { EventModel } from "applesauce-core/models";
import { useEventModel, useObservableMemo } from "applesauce-react/hooks";
import { nip19, NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";
import { BiCode } from "react-icons/bi";
import { Link, useParams } from "react-router";

import { CopyButton } from "../../components/copy-button";
import ServerPicker from "../../components/server-picker";
import {
  getArchiveChunkHashes,
  getArchiveMimeType,
  getArchiveName,
  getArchiveSummary,
  isValidArchive,
} from "../../helpers/archive";
import useDownloader from "../../hooks/use-downloader";
import { singleEventLoader } from "../../services/nostr";
import state from "../../services/state";

function ArchiveDownloadPage({ archive, nevent }: { archive: NostrEvent; nevent: string }) {
  const name = getArchiveName(archive);
  const type = getArchiveMimeType(archive);
  const summary = getArchiveSummary(archive);
  const root = getTagValue(archive, "x");
  const hashes = useMemo(() => getArchiveChunkHashes(archive).map(bytesToHex), [archive]);

  const raw = useDisclosure();
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
        <ButtonGroup float="right" size="sm" variant="ghost">
          <CopyButton value={nevent} aria-label="Copy link" />
          <IconButton icon={<Icon as={BiCode} boxSize={6} />} aria-label="Show event" onClick={raw.onToggle} />
        </ButtonGroup>
        <Heading size="md">{name || archive.id.slice(0, 8)}</Heading>
      </Box>
      {summary && <Text whiteSpace="pre-line">{summary}</Text>}

      {raw.isOpen && (
        <Code whiteSpace="pre" overflow="auto">
          {JSON.stringify(archive, null, 2)}
        </Code>
      )}

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

  const archive = useEventModel(EventModel, [decoded.data.id]);
  if (archive && !isValidArchive(archive)) throw new Error("Invalid archive event");

  // load single archive event
  useObservableMemo(() => singleEventLoader(decoded.data), [decoded.data]);

  if (!archive) return <Spinner />;
  return <ArchiveDownloadPage archive={archive} nevent={nevent} />;
}
