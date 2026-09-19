import "server-only";

import { access, mkdir, open, stat, unlink, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";

import type { RangeReadResult, StorageAdapter } from "./adapter";

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

  // D-01: local mode has no real signed-URL concept — the local file path
  // itself is returned as `url` with no `token`. The browser-side direct-PUT
  // flow (03-02/03-04) still writes to this same path via a Route Handler.
  async createUploadTarget(key: string): Promise<{ url: string; token?: string }> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    return { url: filePath };
  }

  async readLeadingBytes(key: string, byteLength: number): Promise<Buffer> {
    const filePath = this.resolve(key);
    const handle = await open(filePath, "r");
    try {
      const buffer = Buffer.alloc(byteLength);
      const { bytesRead } = await handle.read(buffer, 0, byteLength, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  async getObjectSize(key: string): Promise<number> {
    const filePath = this.resolve(key);
    const stats = await stat(filePath);
    return stats.size;
  }

  // Parses a `Range: bytes=start-end` header and returns a ranged read via
  // fs.createReadStream({start, end}). No Range header (or an unparsable
  // one) falls back to a full 200 read of the whole object.
  async readRange(key: string, rangeHeader: string | null): Promise<RangeReadResult> {
    const filePath = this.resolve(key);
    const stats = await stat(filePath);
    const total = stats.size;

    const match = rangeHeader?.match(/^bytes=(\d*)-(\d*)$/);
    if (!match || (match[1] === "" && match[2] === "")) {
      const nodeStream = createReadStream(filePath);
      return {
        stream: Readable.toWeb(nodeStream) as ReadableStream,
        start: 0,
        end: total - 1,
        total,
        status: 200,
      };
    }

    const start = match[1] === "" ? 0 : Number.parseInt(match[1], 10);
    const end = match[2] === "" ? total - 1 : Number.parseInt(match[2], 10);
    const clampedEnd = Math.min(end, total - 1);

    const nodeStream = createReadStream(filePath, { start, end: clampedEnd });
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream,
      start,
      end: clampedEnd,
      total,
      status: 206,
    };
  }

  // D-06: exclusive method for version-creating code — writeFile never
  // merges with an existing file, so this simply reuses putObject's body.
  async putObjectNoOverwrite(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.putObject(key, data, contentType);
  }
}
