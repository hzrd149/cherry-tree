import { useEffect, useState } from "react";
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { BiWallet } from "react-icons/bi";

import Wallet from "./wallet";
import { ErrorBoundary } from "./error-boundary";
import { useWallet } from "../providers/wallet-provider";

export default function WalletButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const wallet = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setBalance(wallet.getBalance()), 1000);
    return () => clearInterval(i);
  }, [wallet]);

  return (
    <>
      <Button onClick={onOpen} aria-label="Open Wallet" leftIcon={<Icon as={BiWallet} boxSize={6} />}>
        {balance}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pb="0">Local Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" gap="2" flexDirection="column" p="2">
            <ErrorBoundary>
              <Wallet />
            </ErrorBoundary>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
