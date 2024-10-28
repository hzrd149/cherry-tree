import { FormEventHandler, useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Flex, Heading, Text, Textarea, useToast } from "@chakra-ui/react";
import { getDecodedToken, getEncodedTokenV4 } from "@cashu/cashu-ts";

import { useWallet } from "../providers/wallet-provider";

type Mode = "balance" | "withdraw" | "deposit";

function BaseNav({ setMode }: { setMode: (mode: Mode) => void }) {
  return (
    <Flex gap="2" w="full" mt="2">
      <Button onClick={() => setMode("withdraw")} flex={1}>
        Withdraw
      </Button>
      <Button onClick={() => setMode("deposit")} flex={1}>
        Deposit
      </Button>
    </Flex>
  );
}

function Withdraw({ setMode }: { setMode: (mode: Mode) => void }) {
  const wallet = useWallet();
  const token = useMemo(() => {
    return getEncodedTokenV4({ token: [wallet.withdrawAll()] });
  }, [wallet]);

  const done = () => {
    wallet.clear();
    setMode("balance");
  };
  const back = () => setMode("balance");

  return (
    <>
      <Textarea value={token} rows={5} />
      <ButtonGroup>
        <Button onClick={back}>Back</Button>
        <Button onClick={done}>Done</Button>
      </ButtonGroup>
    </>
  );
}

function Deposit({ setMode }: { setMode: (mode: Mode) => void }) {
  const toast = useToast();
  const wallet = useWallet();
  const [input, setInput] = useState("");

  const add: FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const token = getDecodedToken(input);
      await wallet.receive(token);

      setMode("balance");
    } catch (error) {
      console.log(error);
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setMode("balance");
  };
  const back = () => setMode("balance");

  return (
    <>
      <Textarea value={input} rows={5} onChange={(e) => setInput(e.target.value)} placeholder="cashuB..." />
      <ButtonGroup w="full">
        <Button onClick={back} flex={1}>
          Back
        </Button>
        <Button onClick={add} flex={1}>
          Add
        </Button>
      </ButtonGroup>
    </>
  );
}

export default function Wallet() {
  const [mode, setMode] = useState<Mode>("balance");

  const wallet = useWallet();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    setAmount(wallet.getBalance());
  }, [wallet, mode]);

  const renderContent = () => {
    switch (mode) {
      default:
      case "balance":
        return (
          <>
            <Heading size="lg" textAlign="center">
              {amount}
            </Heading>
            {wallet.mintUrl && <Text fontSize="sm">{wallet.mintUrl}</Text>}

            <BaseNav setMode={setMode} />
          </>
        );
      case "withdraw":
        return <Withdraw setMode={setMode} />;
      case "deposit":
        return <Deposit setMode={setMode} />;
    }
  };

  return (
    <Flex direction="column" gap="2">
      {renderContent()}
    </Flex>
  );
}
