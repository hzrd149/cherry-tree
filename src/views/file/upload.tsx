import { useState } from "react";
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Icon,
  Progress,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { FiUploadCloud } from "react-icons/fi";
import { bytesToHex } from "@noble/hashes/utils";
import { Link } from "react-router-dom";

import state, { ChunkedFile } from "../../state";
import FileCard from "../../components/file-card";
import { formatFileSize } from "../../helpers/number";
import ServerPicker from "../../components/server-picker";
import RainbowButton from "../../components/rainbow-button";
import MerkleTreeButton from "../../components/merkle-tree-button";
import useUploader from "../../hooks/use-uploader";

export default function UploadFilePage({ file }: { file: ChunkedFile }) {
  if (!file.tree || !file.chunks) return null;

  const [servers, setServers] = useState<string[]>(state.servers.value);
  const anon = useDisclosure({ defaultIsOpen: true });

  const { upload, loading, errors, uploaded, started, error } = useUploader(servers, file.chunks, anon.isOpen);

  if (Object.keys(uploaded).length > 0 || Object.keys(errors).length > 0 || Object.keys(started).length > 0) {
    return (
      <>
        {error ? (
          <Text color="red.500">{error.message}</Text>
        ) : (
          <>
            <Progress hasStripe value={(Object.keys(uploaded).length / file.chunks.length) * 100} size="lg" />
            <Flex gap="2px" wrap="wrap" p="1" borderWidth="1px" rounded="sm">
              {file.chunks.map((chunk) => (
                <Box
                  key={chunk.hash}
                  w="4"
                  h="4"
                  bg={
                    errors[chunk.hash]
                      ? "red.500"
                      : uploaded[chunk.hash]
                        ? "green.500"
                        : started[chunk.hash]
                          ? "blue.500"
                          : "gray.500"
                  }
                />
              ))}
            </Flex>
            <Box>
              {Object.entries(errors).map(([hash, servers]) => (
                <Box key={hash} color="red.500">
                  <Text fontWeight="bold">{hash.slice(0, 8)}</Text>
                  {Object.entries(servers).map(([server, error]) => (
                    <Text key={server}>
                      {server}: {error.message}
                    </Text>
                  ))}
                </Box>
              ))}
            </Box>
          </>
        )}

        {!loading && Object.keys(errors).length > 0 && <Button onClick={upload}>Retry</Button>}
        {Object.keys(uploaded).length === file.chunks.length && (
          <Button size="lg" as={Link} to={`/file/${file.id}/publish`} colorScheme="green">
            Next
          </Button>
        )}
      </>
    );
  }

  return (
    <>
      <FileCard file={file.file} />
      <Flex gap="2" justifyContent="space-between">
        <Heading size="sm">Merkle Tree</Heading>
        <MerkleTreeButton variant="link" tree={file.tree}>
          details
        </MerkleTreeButton>
      </Flex>
      <Code fontFamily="monospace" userSelect="all">
        {bytesToHex(file.tree.hash)}
      </Code>

      <Heading size="sm" mt="2">
        Chunks: {file.chunks.length} ({formatFileSize(file.chunks[0].size)})
      </Heading>
      <Flex gap="2px" wrap="wrap" p="1" borderWidth="1px" rounded="sm">
        {file.chunks.map((chunk, i) => (
          <Tooltip key={i} label={`${chunk.hash.slice(0, 8)} (${formatFileSize(chunk.size)})`}>
            <Box w="4" h="4" bg="gray.500" />
          </Tooltip>
        ))}
      </Flex>

      <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
        <Heading size="md">Upload Chunks</Heading>
        <Switch size="sm" isChecked={anon.isOpen} onChange={anon.onToggle}>
          Anon
        </Switch>
      </Flex>
      <ServerPicker servers={servers} onChange={setServers} />

      {servers.length > 0 && (
        <RainbowButton
          size="lg"
          leftIcon={<Icon as={FiUploadCloud} boxSize={6} />}
          isDisabled={servers.length === 0}
          onClick={upload}
          isLoading={loading}
        >
          Upload
        </RainbowButton>
      )}
    </>
  );
}
