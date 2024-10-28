import {
  Button,
  ButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import MerkleTreeChart from "./merkle-tree-chart";
import { MerkleNode } from "../helpers/merkle";

export default function MerkleTreeButton({
  children,
  tree,
  ...props
}: Omit<ButtonProps, "onClick"> & { tree: MerkleNode }) {
  const modal = useDisclosure();

  return (
    <>
      <Button onClick={modal.onOpen} {...props}>
        {children}
      </Button>

      <Modal onClose={modal.onClose} size="full" isOpen={modal.isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Merkle Tree</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{modal.isOpen && <MerkleTreeChart tree={tree} />}</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
