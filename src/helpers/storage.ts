import { Chunk } from "./blob";

export async function hasChunk(folder: FileSystemDirectoryHandle, hash: string) {
  try {
    folder.getFileHandle(hash);
    return true;
  } catch (error) {
    return false;
  }
}

export async function saveChunk(folder: FileSystemDirectoryHandle, chunk: Chunk) {
  const handle = await folder.getFileHandle(chunk.hash, { create: true });
  const write = await handle.createWritable({ keepExistingData: false });
  await write.write(chunk);
  await write.close();
}

export async function readChunk(folder: FileSystemDirectoryHandle, hash: string, index: number) {
  const handle = await folder.getFileHandle(hash);
  const file = (await handle.getFile()) as unknown as Chunk;
  file.hash = hash;
  file.index = index;
  return file;
}

export async function listChunks(folder: FileSystemDirectoryHandle) {
  const files: string[] = [];
  // @ts-expect-error
  for await (const entry of folder.values()) {
    if (entry.kind === "file") files.push(entry.name);
  }
  return files;
}

export async function clearChunks(folder: FileSystemDirectoryHandle) {
  const files = await listChunks(folder);

  for (const file of files) {
    await folder.removeEntry(file);
  }
}
