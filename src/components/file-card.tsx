import { Box, Text, Flex, Icon, useColorModeValue, CloseButton, LinkBox, Link, ButtonGroup } from "@chakra-ui/react";
import { FiFile, FiImage, FiFileText, FiFilm, FiMusic } from "react-icons/fi";
import { Link as RouterLink, To } from "react-router-dom";

import { formatFileSize } from "../helpers/number";
import { CopyButton } from "./copy-button";

interface FileCardProps {
  file?: File;
  name?: string;
  type?: string;
  size?: number;
  onRemove?: () => void;
  error?: string;
  to?: To;
  copy?: string;
}

export default function FileCard({ file, name, type, size, copy, onRemove, error, to }: FileCardProps) {
  name = name || file?.name;
  type = type || file?.type || "unknown";
  size = size || file?.size;

  // Function to get icon based on file type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FiImage;
    if (type.startsWith("video/")) return FiFilm;
    if (type.startsWith("audio/")) return FiMusic;
    if (type.startsWith("text/")) return FiFileText;
    return FiFile;
  };

  // Function to get file type display name
  const getFileType = (type: string): string => {
    return type.split("/")[1]?.toUpperCase() ?? "unknown";
  };

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Box
      borderWidth="1px"
      rounded="lg"
      borderColor={error ? "red.500" : borderColor}
      bg={bgColor}
      p={4}
      position="relative"
      shadow="sm"
      as={to ? LinkBox : undefined}
    >
      <ButtonGroup variant="ghost" right="2" top="2" position="absolute">
        {copy && <CopyButton value={copy} aria-label="Copy Link" />}
        {onRemove && <CloseButton onClick={onRemove} />}
      </ButtonGroup>
      <Flex>
        <Icon as={getFileIcon(type)} boxSize={6} color={error ? "red.500" : "blue.500"} mr={3} />

        <Box flex="1">
          <Text fontWeight="medium" fontSize="sm" noOfLines={1} title={name}>
            {to ? (
              <Link as={RouterLink} to={to}>
                {name}
              </Link>
            ) : (
              <>{name}</>
            )}
          </Text>

          <Flex fontSize="xs" color={error ? "red.500" : "gray.500"} mt={1} alignItems="center">
            <Text>{getFileType(type)}</Text>
            <Text mx={2}>•</Text>
            <Text>{size ? formatFileSize(size) : "unknown"}</Text>
          </Flex>

          {error && (
            <Text color="red.500" fontSize="xs" mt={1}>
              {error}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
