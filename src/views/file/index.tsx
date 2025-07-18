import { useParams } from "react-router-dom";
import { Text } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import state, { ChunkedFile } from "../../services/state";
import UnchunkedFilePage from "./unchunked";
import UploadFilePage from "./upload";

export function FilePage({ file }: { file: ChunkedFile }) {
  if (!file.chunks) return <UnchunkedFilePage file={file} />;
  return <UploadFilePage file={file} />;
}

export default function FileView() {
  const { id } = useParams();
  const files = useObservableState(state.files);
  const file = files.find((f) => f.id === id);

  if (!file) return <Text color="red.500">Cant find file</Text>;
  return <FilePage file={file} />;
}
