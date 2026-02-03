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
import { castEventStream } from "applesauce-common/observable";
import { use$ } from "applesauce-react/hooks/use-$";
import { nip19 } from "nostr-tools";
import { useMemo, useState } from "react";
import { BiCode } from "react-icons/bi";
import { Link, useParams } from "react-router";

import { ChunkedBlob } from "../../casts/chunked-blob";
import { CopyButton } from "../../components/copy-button";
import ServerPicker from "../../components/server-picker";
import useDownloader from "../../hooks/use-downloader";
import { eventStore } from "../../services/nostr";
import state from "../../services/state";

function ArchiveDownloadPage({ archive, nevent }: { archive: ChunkedBlob; nevent: string }) {
  const hashes = useMemo(() => archive.chunkHashes, [archive.id]);

  const raw = useDisclosure();
  const persist = useDisclosure({ defaultIsOpen: "storage" in navigator });

  const [servers, setServers] = useState<string[]>(() =>
    Array.from(new Set([...state.servers.value, ...archive.servers])),
  );

  const { download, downloaded, verified, loading, errors } = useDownloader(servers, hashes, {
    name: archive.filename,
    type: archive.mimeType,
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
        <Heading size="md">{archive.filename || archive.id.slice(0, 8)}</Heading>
      </Box>
      {archive.summary && <Text whiteSpace="pre-line">{archive.summary}</Text>}

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
        {archive.rootHash}
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

  // Load and cast the archive event
  const archive = use$(
    () => eventStore.event(decoded.data).pipe(castEventStream(ChunkedBlob, eventStore)),
    [decoded.data.id],
  );

  if (!archive) return <Spinner />;
  return <ArchiveDownloadPage archive={archive} nevent={nevent} />;
}
