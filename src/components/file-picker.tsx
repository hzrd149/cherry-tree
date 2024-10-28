import React, { useCallback, useState } from "react";
import { Box, Text, VStack, useColorModeValue, Center } from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      const validFiles = Array.from(files);

      if (validFiles.length > 0) onFileSelect(validFiles);
    },
    [onFileSelect],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files) {
        const validFiles = Array.from(files);
        if (validFiles.length > 0) onFileSelect(validFiles);
      }
    },
    [onFileSelect],
  );

  const borderColor = useColorModeValue("gray.300", "gray.500");
  const bgColor = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("gray.100", "gray.600");

  return (
    <Center>
      <Box width="100%" maxW="xl" position="relative">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          accept="*"
          style={{
            position: "absolute",
            width: "100%",
            height: " 100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
        <Box
          border="2px dashed"
          borderColor={isDragging ? "blue.400" : borderColor}
          borderRadius="xl"
          p={6}
          bg={isDragging ? activeBg : bgColor}
          transition="all 0.2s"
          _hover={{ bg: activeBg }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <VStack spacing={4}>
            <AttachmentIcon w={10} h={10} color="gray.500" />
            <Text textAlign="center" fontSize="lg">
              Drag and drop files here or click to select files
            </Text>
          </VStack>
        </Box>
      </Box>
    </Center>
  );
};

export default FileUpload;
