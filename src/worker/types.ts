export interface WorkerTask {
  id: number;
  blob: Blob;
  index: number;
}
export interface WorkerResult {
  id: number;
  hash: string;
  index: number;
}
