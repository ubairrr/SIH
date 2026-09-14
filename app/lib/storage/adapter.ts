// StorageAdapter interface — Phase 1 scope only.
//
// Phase 1 ships only the interface + env-driven selection (getStorageAdapter);
// no upload UI calls these methods yet. Real wiring into upload/download flows
// is Phase 3's scope. Both implementations (SupabaseStorageAdapter,
// LocalDiskStorageAdapter) are genuine, working code — never stubs that throw
// "not implemented" — so Phase 3 can wire real calls into this same interface
// with zero architectural change.
//
// See .planning/phases/01-login-user-management-tamper-proof-audit-log/01-RESEARCH.md
// Code Examples §3.

import { SupabaseStorageAdapter } from "./supabase";
import { LocalDiskStorageAdapter } from "./local";

export interface StorageAdapter {
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
  getObjectStream(key: string): Promise<ReadableStream>;
  deleteObject(key: string): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  return process.env.STORAGE_DRIVER === "supabase"
    ? new SupabaseStorageAdapter()
    : new LocalDiskStorageAdapter();
}
