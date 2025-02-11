import { useMemo } from "react";
import { Avatar, AvatarProps, Icon } from "@chakra-ui/react";
import { BiServer } from "react-icons/bi";

export type RelayFaviconProps = Omit<AvatarProps, "src"> & {
  host: string;
};
export default function Favicon({ host, ...props }: RelayFaviconProps) {
  const url = useMemo(() => {
    const url = new URL(host);
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [host]);

  return <Avatar src={url} icon={<Icon as={BiServer} boxSize={6} />} overflow="hidden" {...props} />;
}
