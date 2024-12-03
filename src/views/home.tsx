import { Button, Flex, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { neventEncode } from "nostr-tools/nip19";
import { useObservable, useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";

import FileUpload from "../components/file-picker";
import state, { addFiles, removeFile } from "../state";
import FileCard from "../components/file-card";

import { ErrorBoundary } from "../components/error-boundary";
import { getArchiveMimeType, getArchiveName, getArchiveSize, isValidArchive } from "../helpers/archive";
import useSubscription from "../hooks/use-subscription";

export default function HomeView() {
  const files = useObservable(state.files);
  const navigate = useNavigate();

  const relays = useObservable(state.relays);
  useSubscription("home-archives", { kinds: [2001] });

  const archives = useStoreQuery(TimelineQuery, [{ kinds: [2001] }])?.filter(isValidArchive);

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
              name={getArchiveName(archive) || "Unknown"}
              type={getArchiveMimeType(archive)}
              size={getArchiveSize(archive)}
              copy={nevent}
            />
          </ErrorBoundary>
        );
      })}
    </Flex>
  );
}
