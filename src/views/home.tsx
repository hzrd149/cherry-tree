import { useEffect } from "react";
import { Button, Flex, Heading } from "@chakra-ui/react";

import FileUpload from "../components/file-picker";
import state, { addFiles, addArchiveEvent, removeFile } from "../state";
import FileCard from "../components/file-card";
import { useNavigate } from "react-router-dom";
import { neventEncode } from "nostr-tools/nip19";

import { relayPool } from "../pool";
import { getTagValue } from "../helpers/nostr";
import { useObservable } from "../hooks/use-observable";
import { ErrorBoundary } from "../components/error-boundary";

export default function HomeView() {
  const files = useObservable(state.files);
  const navigate = useNavigate();

  const relays = useObservable(state.relays);
  const archives = useObservable(state.archives);

  useEffect(() => {
    const sub = relayPool.subscribeMany(relays, [{ kinds: [2001] }], { onevent: (event) => addArchiveEvent(event) });

    return () => sub.close();
  }, []);

  const handleFile = (files: File[]) => {
    const chunked = addFiles(files);
    navigate(`/file/${chunked[0].id}`);
  };

  return (
    <Flex gap="2" direction="column" w="full">
      <FileUpload onFileSelect={handleFile} />

      {files.length > 0 && (
        <>
          <Flex justifyContent="space-between" alignItems="flex-end">
            <Heading size="md" mt="2">
              Files
            </Heading>
            <Button variant="link" onClick={() => state.files.next([])}>
              Clear
            </Button>
          </Flex>
          {files.map((file) => (
            <FileCard key={file.id} file={file.file} onRemove={() => removeFile(file.id)} to={`/file/${file.id}`} />
          ))}
        </>
      )}

      <Heading size="md" mt="2">
        Archives
      </Heading>
      {archives?.map((archive) => {
        const nevent = neventEncode({ id: archive.id, author: archive.pubkey, relays: relays.slice(0, 2) });

        return (
          <ErrorBoundary key={archive.id}>
            <FileCard
              to={`/archive/${nevent}`}
              name={getTagValue(archive, "title")}
              type={getTagValue(archive, "m")}
              size={parseInt(getTagValue(archive, "size") ?? "")}
              copy={nevent}
            />
          </ErrorBoundary>
        );
      })}
    </Flex>
  );
}
