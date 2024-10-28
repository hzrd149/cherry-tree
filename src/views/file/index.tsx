import { useParams } from "react-router-dom";
import { Text } from "@chakra-ui/react";

import state, { ChunkedFile } from "../../state";
import UnchunkedFilePage from "./unchunked";
import UploadFilePage from "./upload";
import { useObservable } from "../../hooks/use-observable";

export function FilePage({ file }: { file: ChunkedFile }) {
  if (!file.chunks || !file.tree) return <UnchunkedFilePage file={file} />;
  return <UploadFilePage file={file} />;
}

export default function FileView() {
  const { id } = useParams();
  const files = useObservable(state.files);
  const file = files.find((f) => f.id === id);

  if (!file) return <Text color="red.500">Cant find file</Text>;
  return <FilePage file={file} />;
}
