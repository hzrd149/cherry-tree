import { useState } from "react";
import { Icon, IconButton, IconButtonProps } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { BiClipboard } from "react-icons/bi";

type CopyIconButtonProps = Omit<IconButtonProps, "icon" | "value"> & {
  value: string | undefined | (() => string);
};

export function CopyButton({ value, ...props }: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      icon={copied ? <CheckIcon boxSize="1.2em" /> : <Icon as={BiClipboard} boxSize="1.2em" />}
      onClick={() => {
        const v: string | undefined = typeof value === "function" ? value() : value;

        if (v && navigator.clipboard && !copied) {
          navigator.clipboard.writeText(v);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      {...props}
    />
  );
}
