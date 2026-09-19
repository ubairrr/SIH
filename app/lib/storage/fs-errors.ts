// T-03-07-02: isolated, testable EEXIST detection for LocalDiskStorageAdapter's
// putObjectNoOverwrite — no "server-only" import, kept plain-Node testable.
export function isEexistError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "EEXIST"
  );
}
