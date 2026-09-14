import "server-only";

import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";

import type { StorageAdapter } from "./adapter";

// LocalDiskStorageAdapter — offline-mode implementation, used by the
// `npm run dev:offline` docker-compose path. Genuine fs/promises reads/
// writes/deletes against LOCAL_STORAGE_PATH — never a stub.
export class LocalDiskStorageAdapter implements StorageAdapter {
  private root() {
    return process.env.LOCAL_STORAGE_PATH ?? "./.data/storage";
  }

  private resolve(key: string) {
    return path.join(this.root(), key);
  }

  async putObject(key: string, data: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async getObjectStream(key: string): Promise<ReadableStream> {
    const filePath = this.resolve(key);
    // Verify the file exists first so callers get a clear error instead of
    // a stream that emits an error event.
    try {
      await access(filePath);
    } catch (error) {
      throw new Error(
        `LocalDiskStorageAdapter.getObjectStream failed for "${key}": ${(error as Error).message}`,
      );
    }
    const nodeStream = createReadStream(filePath);
    return Readable.toWeb(nodeStream) as ReadableStream;
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.resolve(key);
    await unlink(filePath);
  }
}
