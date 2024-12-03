import { ButtonGroup, Flex, Heading, Icon, IconButton, useColorMode } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { BiCog } from "react-icons/bi";

import WalletButton from "./wallet-button";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export default function Header() {
  const { toggleColorMode, colorMode } = useColorMode();

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Heading my="4">
        <Link to="/">Cherry Tree</Link>
      </Heading>
      <ButtonGroup>
        <IconButton
          icon={colorMode === "light" ? <SunIcon /> : <MoonIcon />}
          aria-label="Theme"
          onClick={toggleColorMode}
          variant="ghost"
        />
        <IconButton icon={<Icon as={BiCog} boxSize={6} />} aria-label="Settings" as={Link} to="/settings" />
        <WalletButton />
      </ButtonGroup>
    </Flex>
  );
}
