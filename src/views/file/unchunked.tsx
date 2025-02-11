import { useState } from "react";
import { Box, Button, Flex, FormControl, FormLabel, HStack, Radio, RadioGroup, useToast } from "@chakra-ui/react";

import { ChunkedFile, updateFile } from "../../services/state";
import FileCard from "../../components/file-card";
import { Chunk, chunkFile } from "../../helpers/blob";

export default function UnchunkedFilePage({ file }: { file: ChunkedFile }) {
  const toast = useToast();
  const [size, setSize] = useState("large");

  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const chunk = async () => {
    if (size !== "small" && size !== "large") return;

    try {
      setLoading(true);
      let update: Chunk[] = [];
      const i = setInterval(() => {
        setChunks((v) => [...v, ...update]);
        update = [];
      }, 1000 / 30);

      const chunks = await chunkFile(file.file, size, {
        onChunk: (chunk) => update.push(chunk),
      });

      clearInterval(i);

      updateFile(file.id, { chunks });
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  return (
    <>
      <FileCard file={file.file} />
      <FormControl>
        <FormLabel>Chunk Size</FormLabel>
        <RadioGroup value={size} onChange={(v) => setSize(v)}>
          <HStack spacing="24px">
            <Radio value="large">Large</Radio>
            <Radio value="small">Small</Radio>
          </HStack>
        </RadioGroup>
      </FormControl>

      {chunks.length > 0 && (
        <Flex gap="2px" wrap="wrap" p="1" borderWidth="1px" rounded="sm">
          {chunks.map((chunk) => (
            <Box key={chunk.hash} w="4" h="4" bg="gray.500" />
          ))}
        </Flex>
      )}

      <Button size="lg" colorScheme="pink" w="full" onClick={chunk} isLoading={loading}>
        Chunk file
      </Button>
    </>
  );
}
