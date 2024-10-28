import { ButtonGroup, Flex, Heading, Icon, IconButton } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { BiCog } from "react-icons/bi";

import WalletButton from "./wallet-button";

export default function Header() {
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Heading my="4">
        <Link to="/">Cherry Tree</Link>
      </Heading>
      <ButtonGroup>
        <IconButton icon={<Icon as={BiCog} boxSize={6} />} aria-label="Settings" as={Link} to="/settings" />
        <WalletButton />
      </ButtonGroup>
    </Flex>
  );
}
