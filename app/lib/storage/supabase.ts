import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { StorageAdapter } from "./adapter";

// SupabaseStorageAdapter — hosted-mode implementation.
//
// Uses the service-role key server-side only (T-04-03). No client component
// in this phase imports this module — `import "server-only"` above turns any
// future accidental client import into a build-time error.
//
// Real, working wrapper around the @supabase/supabase-js Storage SDK — no
// upload UI calls this yet (that's Phase 3), but the adapter itself must be
// genuine code, never a stub that throws "not implemented".
const BUCKET = "casevault-files";

export class SupabaseStorageAdapter implements StorageAdapter {
  private client() {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async putObject(key: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client()
      .storage.from(BUCKET)
      .upload(key, data, { contentType, upsert: true });

    if (error) {
      throw new Error(`SupabaseStorageAdapter.putObject failed for "${key}": ${error.message}`);
    }
  }

  async getObjectStream(key: string): Promise<ReadableStream> {
    const { data, error } = await this.client().storage.from(BUCKET).download(key);

    if (error || !data) {
      throw new Error(
        `SupabaseStorageAdapter.getObjectStream failed for "${key}": ${error?.message ?? "no data returned"}`,
      );
    }

    return data.stream();
  }

  async deleteObject(key: string): Promise<void> {
    const { error } = await this.client().storage.from(BUCKET).remove([key]);

    if (error) {
      throw new Error(`SupabaseStorageAdapter.deleteObject failed for "${key}": ${error.message}`);
    }
  }
}
