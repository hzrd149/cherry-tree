import { useEffect, useState } from "react";
import {
  Button,
  Badge,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Text,
  Link,
  useToast,
} from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import ServerPicker from "../components/server-picker";
import state from "../services/state";
import RelayPicker from "../components/relay-picker";
import { formatFileSize } from "../helpers/number";
import { clearChunks } from "../helpers/storage";
import { checkLocalBlossomCache, LocalBlossomCacheStatus } from "../helpers/blob-storage";
import { BlobStorageBackend } from "../services/settings";

function getLocalCacheStatusLabel(status: LocalBlossomCacheStatus | "checking") {
  switch (status) {
    case "checking":
      return "Checking";
    case "available-writable":
      return "Running and writable";
    case "available-readonly":
      return "Running, uploads rejected";
    case "unavailable":
      return "Not running";
  }
}

function getLocalCacheStatusColor(status: LocalBlossomCacheStatus | "checking") {
  switch (status) {
    case "checking":
      return "blue";
    case "available-writable":
      return "green";
    case "available-readonly":
      return "orange";
    case "unavailable":
      return "red";
  }
}

export default function SettingsView() {
  const toast = useToast();
  const servers = useObservableState(state.servers);
  const relays = useObservableState(state.relays);
  const downloaders = useObservableState(state.downloaders);
  const uploaders = useObservableState(state.uploaders);
  const blobStorageBackend = useObservableState(state.blobStorageBackend);

  const [localCacheStatus, setLocalCacheStatus] = useState<LocalBlossomCacheStatus | "checking">("checking");
  const checkLocalCache = async (signal?: AbortSignal) => {
    setLocalCacheStatus("checking");
    const status = await checkLocalBlossomCache(signal);
    if (signal?.aborted) return;

    setLocalCacheStatus(status);
    if (status !== "available-writable" && state.blobStorageBackend.value === "local-blossom") {
      state.blobStorageBackend.next("browser");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    checkLocalCache(controller.signal);
    return () => controller.abort();
  }, []);

  const [estimate, setEstimate] = useState<StorageEstimate>();
  useEffect(() => {
    if ("storage" in navigator) navigator.storage.estimate().then(setEstimate);
  }, []);

  const [loading, setLoading] = useState(false);
  const clear = async () => {
    if (!("storage" in navigator)) return;

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

      <Flex direction="column" gap="2" mt="2">
        <Heading size="md">Blob Storage</Heading>
        <RadioGroup
          value={blobStorageBackend}
          onChange={(value) => state.blobStorageBackend.next(value as BlobStorageBackend)}
        >
          <Flex direction="column" gap="2">
            <Radio value="browser" isDisabled={!("storage" in navigator)}>
              Browser storage
            </Radio>
            <Radio value="local-blossom" isDisabled={localCacheStatus !== "available-writable"}>
              Local Blossom cache
            </Radio>
          </Flex>
        </RadioGroup>
        <Flex gap="2" alignItems="center">
          <Badge colorScheme={getLocalCacheStatusColor(localCacheStatus)}>
            {getLocalCacheStatusLabel(localCacheStatus)}
          </Badge>
          <Button size="sm" onClick={() => checkLocalCache()} isLoading={localCacheStatus === "checking"}>
            Check Local Cache
          </Button>
        </Flex>
        <Text color="GrayText" fontSize="sm">
          A{" "}
          <Link href="https://github.com/hzrd149/blossom/blob/master/implementations/local-blossom-cache.md" isExternal>
            local Blossom cache
          </Link>{" "}
          stores blobs on a server running at 127.0.0.1:24242 for faster local access and proxy downloads. It is not
          added to published server lists.
        </Text>
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
