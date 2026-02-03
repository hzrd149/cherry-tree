import { Button, Flex, Heading } from "@chakra-ui/react";
import { castTimelineStream } from "applesauce-common/observable";
import { useObservableState } from "applesauce-react/hooks";
import { use$ } from "applesauce-react/hooks/use-$";
import { neventEncode } from "nostr-tools/nip19";
import { useNavigate } from "react-router";

import { ChunkedBlob } from "../casts/chunked-blob";
import { ErrorBoundary } from "../components/error-boundary";
import FileCard from "../components/file-card";
import FileUpload from "../components/file-picker";
import useTimeline from "../hooks/use-timeline";
import { eventStore } from "../services/nostr";
import { defaultRelays } from "../services/settings";
import state, { addFiles, removeFile } from "../services/state";

export default function HomeView() {
  const files = useObservableState(state.files);
  const navigate = useNavigate();

  const relays = useObservableState(defaultRelays);
  useTimeline(relays, { kinds: [2001] });

  // Cast timeline to ChunkedBlob instances
  const archives = use$(
    () => eventStore.timeline({ kinds: [2001] }).pipe(castTimelineStream(ChunkedBlob, eventStore)),
    [relays?.join("|")],
  );

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
        const nevent = neventEncode({ id: archive.id, author: archive.event.pubkey, relays: relays.slice(0, 2) });

        return (
          <ErrorBoundary key={archive.id}>
            <FileCard
              to={`/archive/${nevent}`}
              name={archive.filename || "Unknown"}
              type={archive.mimeType}
              size={archive.size}
              copy={nevent}
            />
          </ErrorBoundary>
        );
      })}
    </Flex>
  );
}
