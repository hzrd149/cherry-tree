import { Box, Flex, Heading, Spinner, Switch, Text, useDisclosure } from "@chakra-ui/react";
import { castEventStream } from "applesauce-common/observable";
import { use$ } from "applesauce-react/hooks/use-$";
import { nip19 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { ChunkedBlob } from "../../casts/chunked-blob";
import { CopyButton } from "../../components/copy-button";
import RainbowButton from "../../components/rainbow-button";
import ServerPicker from "../../components/server-picker";
import { Chunk } from "../../helpers/blob";
import { readChunk } from "../../helpers/storage";
import useUploader from "../../hooks/use-uploader";
import { eventStore, singleEventLoader } from "../../services/nostr";
import state from "../../services/state";

function ArchiveUploadPage({ archive, nevent }: { archive: ChunkedBlob; nevent: string }) {
  const hashes = useMemo(() => archive.chunkHashes, [archive.id]);

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
        <Heading size="md">{archive.filename || archive.id.slice(0, 8)}</Heading>
      </Box>
      {archive.summary && <Text whiteSpace="pre-line">{archive.summary}</Text>}

      <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
        <Heading size="md">Servers</Heading>
      </Flex>
      <ServerPicker servers={servers} onChange={setServers} priceCheck={hashes[0]} />

      <Flex gap="2" mt="2" justifyContent="space-between" alignItems="flex-end">
        <Heading size="sm">Chunks: {archive.chunkCount}</Heading>
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

  // Load and cast the archive event
  const archive = use$(
    () => singleEventLoader(decoded.data).pipe(castEventStream(ChunkedBlob, eventStore)),
    [decoded.data.id],
  );

  if (!archive) return <Spinner />;
  return <ArchiveUploadPage archive={archive} nevent={nevent} />;
}
