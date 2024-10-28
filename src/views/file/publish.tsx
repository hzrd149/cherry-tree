import { useCallback, useState } from "react";
import {
  Button,
  Checkbox,
  Code,
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
import { useNavigate, useParams } from "react-router-dom";
import { bytesToHex } from "@noble/hashes/utils";
import { neventEncode } from "nostr-tools/nip19";

import state, { ChunkedFile, removeFile } from "../../state";
import FileCard from "../../components/file-card";
import { relayPool } from "../../pool";
import RelayPicker from "../../components/relay-picker";
import { EventTemplate, finalizeEvent, generateSecretKey } from "nostr-tools";
import { encodeTree } from "../../helpers/merkle";
import { bytesToBase64 } from "../../helpers/base64";
import MerkleTreeButton from "../../components/merkle-tree-button";
import ServerPicker from "../../components/server-picker";
import { useObservable } from "../../hooks/use-observable";

function PublishPage({ file }: { file: ChunkedFile }) {
  if (!file.tree || !file.chunks) return null;
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
    if (!file.tree || !file.chunks) return null;
    try {
      setLoading(true);

      const draft: EventTemplate = {
        kind: 2001,
        content: bytesToBase64(encodeTree(file.tree)),
        created_at: Math.round(Date.now() / 1000),
        tags: [["alt", "Chunked file"]],
      };

      // add merkel root
      draft.tags.push(["x", bytesToHex(file.tree.hash), "merkle"]);

      // add metadata
      if (metadata.isOpen) {
        if (name) draft.tags.push(["title", name]);
        if (summary) draft.tags.push(["summary", summary]);
        if (type) draft.tags.push(["m", type]);
        draft.tags.push(["size", String(file.file.size)]);
      }

      // add recommended blossom servers
      if (addServers.isOpen) {
        for (const server of servers) {
          draft.tags.push(["server", server]);
        }
      }

      const signed = await signer(draft);
      await relayPool.publish(relays, signed);

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
        <Flex gap="2" justifyContent="space-between">
          <Heading size="sm">Merkle Tree</Heading>
          <MerkleTreeButton variant="link" tree={file.tree}>
            details
          </MerkleTreeButton>
        </Flex>
        <Code fontFamily="monospace" userSelect="all">
          {bytesToHex(file.tree.hash)}
        </Code>

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
  const files = useObservable(state.files);
  const file = files.find((f) => f.id === id);

  if (!file) return <Text color="red.500">Cant find file</Text>;
  return <PublishPage file={file} />;
}
