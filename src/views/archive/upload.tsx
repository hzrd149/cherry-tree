import { Box, Flex, Heading, Spinner, Switch, Text, useDisclosure } from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { useObservable, useStoreQuery } from "applesauce-react/hooks";
import { SingleEventQuery } from "applesauce-core/queries";
import { useParams } from "react-router-dom";
import { bytesToHex } from "@noble/hashes/utils";

import { relayPool } from "../../pool";
import state, { eventStore } from "../../state";
import ServerPicker from "../../components/server-picker";
import { CopyButton } from "../../components/copy-button";
import useUploader from "../../hooks/use-uploader";
import { readChunk } from "../../helpers/storage";
import { Chunk } from "../../helpers/blob";
import RainbowButton from "../../components/rainbow-button";
import { getArchiveChunkHashes, getArchiveName, getArchiveSummary } from "../../helpers/archive";

function ArchiveUploadPage({ archive, nevent }: { archive: NostrEvent; nevent: string }) {
  const name = getArchiveName(archive);
  const summary = getArchiveSummary(archive);
  const hashes = useMemo(() => getArchiveChunkHashes(archive).map(bytesToHex), [archive]);

  const [servers, setServers] = useState<string[]>(state.servers.value);
  const anon = useDisclosure({ defaultIsOpen: true });

  const [chunks, setChunks] = useState<(Chunk | null)[]>([]);
  const available = useMemo(() => chunks.filter((c) => c !== null).map((c) => c.hash), [chunks]);

  // load cached chunks
  useEffect(() => {
    if ("storage" in navigator) {
      navigator.storage.getDirectory().then((folder) => {
        Promise.all(
          hashes.map(async (hash, index) => {
            try {
              return await readChunk(folder, hash, index);
            } catch (error) {
              return null;
            }
          }),
        ).then(setChunks);
      });
    }
  }, [hashes.length]);

  const localChunks = useMemo(() => chunks.filter((c) => c !== null), [chunks]);
  const { upload, uploaded, loading, errors } = useUploader(servers, localChunks, anon.isOpen, false);

  return (
    <Flex gap="2" direction="column">
      <Box>
        <CopyButton float="right" size="sm" value={nevent} aria-label="Copy link" variant="ghost" />
        <Heading size="md">{name || archive.id.slice(0, 8)}</Heading>
      </Box>
      {summary && <Text whiteSpace="pre-line">{summary}</Text>}

      <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
        <Heading size="md">Servers</Heading>
      </Flex>
      <ServerPicker servers={servers} onChange={setServers} priceCheck={hashes[0]} />

      <Flex gap="2" mt="2" justifyContent="space-between" alignItems="flex-end">
        <Heading size="sm">Chunks: {hashes.length}</Heading>
        <Switch size="sm" isChecked={anon.isOpen} onChange={anon.onToggle}>
          Anon
        </Switch>
      </Flex>
      <Flex gap="2px" wrap="wrap" p="1" borderWidth="1px" rounded="sm">
        {hashes.map((hash) => (
          <Box
            key={hash}
            w="4"
            h="4"
            bg={
              uploaded[hash]
                ? "green.500"
                : errors[hash]
                  ? "red.500"
                  : available.includes(hash)
                    ? "blue.500"
                    : "gray.500"
            }
          />
        ))}
      </Flex>

      <RainbowButton size="lg" w="full" isLoading={loading} onClick={upload} isDisabled={servers.length === 0}>
        Upload
      </RainbowButton>
    </Flex>
  );
}

export default function ArchiveUploadView() {
  const { nevent } = useParams();
  if (!nevent) throw new Error("Missing nevent");
  const decoded = nip19.decode(nevent);
  if (decoded.type !== "nevent") throw new Error(`Unsupported ${decoded.type}`);

  const relays = useObservable(state.relays);
  const event = useStoreQuery(SingleEventQuery, [decoded.data.id]);

  // load event
  useEffect(() => {
    if (event) return;

    relayPool
      .get([...relays, ...(decoded.data.relays ?? [])], { ids: [decoded.data.id] })
      .then((event) => event && eventStore.add(event));
  }, [decoded, event]);

  if (!event) return <Spinner />;
  return <ArchiveUploadPage archive={event} nevent={nevent} />;
}
