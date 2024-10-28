import { Chunk } from "../helpers/blob";
import { createDefer, Deferred } from "../helpers/deferred";
import { WorkerTask, WorkerResult } from "./types.ts";

function getNumThreads() {
  if (navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  } else {
    return 4;
  }
}

type QueueTask = WorkerTask & { done: Deferred<Chunk> };

export default class BlobHasher {
  private workers: Worker[] = [];
  private idle = new Set<Worker>();
  private queue: QueueTask[] = [];
  // running tasks
  private tasks = new Map<number, QueueTask>();
  private taskId = 0;
  private running = false;

  onChunk: ((chunk: Chunk) => void) | null = null;

  private handleWorkerResult(result: WorkerResult) {
    const task = this.tasks.get(result.id);
    if (!task) return;
    if (result.index !== task.index) throw new Error("Index mismatch");
    this.tasks.delete(result.id);

    const chunk = task.blob as Chunk;
    chunk.index = task.index;
    chunk.hash = result.hash;

    this.onChunk?.(chunk);
    task.done.resolve(chunk);
  }

  private processNextTask(worker: Worker) {
    if (this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.tasks.set(task.id, task);
      worker.postMessage({ id: task.id, blob: task.blob, index: task.index } satisfies WorkerTask);
      this.idle.delete(worker);
    } else {
      this.idle.add(worker);
    }
  }

  addToQueue(blob: Blob, index: number): Promise<Chunk> {
    const done = createDefer<Chunk>();
    const task: QueueTask = { id: this.taskId++, blob, index, done };

    this.queue.push(task);
    if (!this.running) this.start();
    else if (this.idle.size > 0) {
      const worker = Array.from(this.idle)[0];
      this.processNextTask(worker);
    }

    return done;
  }

  waitForComplete() {
    // wait for all running tasks and queue to finish
    return Promise.allSettled([
      ...this.queue.map((t) => t.done),
      ...Array.from(this.tasks.values()).map((t) => t.done),
    ]);
  }

  start(parallel?: number) {
    if (this.running) return;
    this.running = true;
    parallel = parallel ?? getNumThreads();

    // Create workers
    this.workers = [];
    for (let i = 0; i < parallel; i++) {
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        this.handleWorkerResult(e.data);
        this.processNextTask(worker);
      };

      this.workers.push(worker);
      this.idle.add(worker);
    }

    // Start initial tasks
    this.workers.forEach((worker) => this.processNextTask(worker));
  }

  stop() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.idle.clear();
    this.queue = [];
    this.tasks.clear();
    this.taskId = 0;
    this.running = false;
  }
}
