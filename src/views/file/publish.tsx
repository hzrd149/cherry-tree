import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Switch,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { useObservableState } from "applesauce-react/hooks";
import { EventTemplate, finalizeEvent, generateSecretKey } from "nostr-tools";
import { neventEncode } from "nostr-tools/nip19";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lastValueFrom } from "rxjs";

import FileCard from "../../components/file-card";
import RelayPicker from "../../components/relay-picker";
import ServerPicker from "../../components/server-picker";
import { getRootHash } from "../../helpers/blob";
import pool from "../../services/pool";
import { defaultRelays } from "../../services/settings";
import state, { ChunkedFile, removeFile } from "../../services/state";

function PublishPage({ file }: { file: ChunkedFile }) {
  if (!file.chunks) return null;
  const navigate = useNavigate();
  const toast = useToast();

  const anon = useDisclosure();
  const metadata = useDisclosure({ defaultIsOpen: true });
  const [name, setName] = useState(file.file.name);
  const [type, setType] = useState(file.file.type);
  const [summary, setSummary] = useState("");
  const [servers, setServers] = useState(state.servers.value);
  const [relays, setRelays] = useState(state.relays.value);
  const addServers = useDisclosure({ defaultIsOpen: true });

  const rootHash = useMemo(() => {
    if (!file.chunks) throw new Error("Missing chunks");
    const hashes = file.chunks.map((c) => hexToBytes(c.hash));
    return bytesToHex(getRootHash(hashes));
  }, [file.chunks]);

  const signer = useCallback(
    async (draft: EventTemplate) => {
      if (anon.isOpen) return finalizeEvent(draft, generateSecretKey());
      else if (window.nostr) return window.nostr?.signEvent(draft);
      else throw new Error("Missing signer");
    },
    [anon],
  );

  const [loading, setLoading] = useState(false);
  const publish = async () => {
    if (!file.chunks) return null;
    try {
      setLoading(true);

      const draft: EventTemplate = {
        kind: 2001,
        content: summary,
        created_at: Math.round(Date.now() / 1000),
        tags: [["alt", "Chunked blob"], ...file.chunks.map((c) => ["chunk", c.hash])],
      };

      // add root hash
      draft.tags.push(["x", rootHash]);

      // add metadata
      if (metadata.isOpen) {
        if (name) draft.tags.push(["name", name]);
        if (type) draft.tags.push(["mime", type]);
      }

      // add size
      draft.tags.push(["size", String(file.file.size)]);

      // add recommended blossom servers
      if (addServers.isOpen) {
        for (const server of servers) {
          draft.tags.push(["server", server]);
        }
      }

      const signed = await signer(draft);
      await lastValueFrom(pool.publish(defaultRelays.value, signed));

      navigate(`/archive/${neventEncode({ id: signed.id, author: signed.pubkey, relays: relays.slice(0, 4) })}`);
      removeFile(file.id);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  return (
    <>
      <Flex gap="2" direction="column">
        <FileCard file={file.file} />

        <Flex gap="2" justifyContent="space-between" alignItems="flex-end">
          <Heading size="md">Metadata</Heading>
          <Switch size="sm" isChecked={metadata.isOpen} onChange={metadata.onToggle}>
            Include
          </Switch>
        </Flex>
        {metadata.isOpen && (
          <>
            <FormControl>
              <FormLabel>Filename</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Summary</FormLabel>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
            </FormControl>
          </>
        )}

        <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
          <Heading size="md">Relays</Heading>
          <Checkbox isChecked={addServers.isOpen} onChange={addServers.onToggle} isDisabled={servers.length === 0}>
            Add servers ({servers.length})
          </Checkbox>
        </Flex>
        <ServerPicker servers={servers} onChange={(r) => setServers(r)} />

        <Flex gap="2" justifyContent="space-between" alignItems="flex-end" mt="2">
          <Heading size="md">Relays</Heading>
          <Switch size="sm" isChecked={anon.isOpen} onChange={anon.onToggle}>
            Anon
          </Switch>
        </Flex>
        <RelayPicker relays={relays} onChange={(r) => setRelays(r)} />

        <Button size="lg" w="full" colorScheme="purple" onClick={publish} isLoading={loading}>
          Publish
        </Button>
      </Flex>
    </>
  );
}

export default function PublishView() {
  const { id } = useParams();
  const files = useObservableState(state.files);
  const file = files.find((f) => f.id === id);

  if (!file) return <Text color="red.500">Cant find file</Text>;
  return <PublishPage file={file} />;
}
