import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react";

import ServerPicker from "../components/server-picker";
import state from "../state";
import RelayPicker from "../components/relay-picker";
import { formatFileSize } from "../helpers/number";
import { clearChunks } from "../helpers/storage";
import { useObservable } from "../hooks/use-observable";

export default function SettingsView() {
  const toast = useToast();
  const servers = useObservable(state.servers);
  const relays = useObservable(state.relays);
  const downloaders = useObservable(state.downloaders);
  const uploaders = useObservable(state.uploaders);

  const [estimate, setEstimate] = useState<StorageEstimate>();
  useEffect(() => {
    if ("storage" in navigator) navigator.storage.estimate().then(setEstimate);
  }, []);

  const [loading, setLoading] = useState(false);
  const clear = async () => {
    try {
      setLoading(true);
      const folder = await navigator.storage.getDirectory();
      await clearChunks(folder);
      navigator.storage.estimate().then(setEstimate);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  return (
    <Flex gap="2" direction="column">
      <Heading size="md">Servers</Heading>
      <ServerPicker servers={servers} onChange={(s) => state.servers.next(s)} />
      <Heading size="md" mt="2">
        Relays
      </Heading>
      <RelayPicker relays={relays} onChange={(s) => state.relays.next(s)} />

      <Flex gap="2">
        <FormControl>
          <FormLabel>Parallel Downloads</FormLabel>
          <NumberInput value={downloaders} min={1} max={10} onChange={(_, v) => state.downloaders.next(v)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Parallel Uploads</FormLabel>
          <NumberInput value={uploaders} min={1} max={10} onChange={(_, v) => state.uploaders.next(v)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      </Flex>

      {estimate && (
        <Flex direction="column">
          <Heading size="md" mt="2">
            Storage
          </Heading>
          {estimate.usage && <Text>Used: {formatFileSize(estimate.usage)}</Text>}
          {estimate.quota && <Text>Quota: {formatFileSize(estimate.quota)}</Text>}
          <Button colorScheme="red" onClick={clear} isLoading={loading} mt="2">
            Clear Storage
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
