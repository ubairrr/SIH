import { authorize } from "@/app/lib/authorize";
import { LocalDiskStorageAdapter } from "@/app/lib/storage/local";
import { isValidStorageKeyShape } from "@/app/lib/storage/key";
import { StorageAdapterError } from "@/app/lib/storage/adapter";
import { verifyUploadToken } from "@/app/lib/storage/upload-token";

// Local-disk-mode-only counterpart to Supabase's signed-upload-URL PUT
// target. LocalDiskStorageAdapter.createUploadTarget() has no real signed
// URL — it just hands back the local file path, so the browser PUTs bytes
// here instead, with the same server-generated `key` as a query param
// (never client-controlled, closing the path-traversal/IDOR angle at the
// key-generation step per requestUpload). This route only writes staged
// bytes — finalizeUpload still does the authoritative magic-byte/size
// re-check afterward, exactly as the hosted-mode flow does.
export const runtime = "nodejs";

function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export async function PUT(req: Request) {
  if (process.env.STORAGE_DRIVER === "supabase") {
    return new Response("Not found", { status: 404 });
  }

  let actor;
  try {
    actor = await authorize();
  } catch (err) {
    if (isNextRedirectError(err)) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw err;
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return new Response("Missing key query param", { status: 400 });
  }
  // CR-01: validate the key's shape BEFORE it ever reaches the filesystem —
  // this is the primary defense against path traversal / arbitrary file
  // write via this route (LocalDiskStorageAdapter.resolve() also has its own
  // containment backstop, but rejecting malformed keys here is the correct
  // place to stop the request).
  if (!isValidStorageKeyShape(key)) {
    return new Response("Invalid key", { status: 400 });
  }

  // T-03-07-01: verify the caller-specific, purpose-bound upload-session
  // credential BEFORE reading any bytes from the request body — closes the
  // gap where any authenticated session (any role/department) was sufficient
  // to PUT bytes to any correctly-shaped key.
  const uploadToken = req.headers.get("x-upload-token");
  if (!uploadToken) {
    return new Response("Missing upload token", { status: 401 });
  }
  const verified = await verifyUploadToken(uploadToken);
  if (!verified || verified.key !== key || verified.userId !== actor.id) {
    return new Response("Invalid or expired upload session", { status: 403 });
  }

  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";

  const adapter = new LocalDiskStorageAdapter();
  try {
    await adapter.putObjectNoOverwrite(key, buffer, contentType);
  } catch (err) {
    if (err instanceof StorageAdapterError) {
      // WR-03 pattern: never echo the caught error's message — it embeds the
      // filesystem path.
      return new Response("Storage key already in use", { status: 409 });
    }
    throw err;
  }

  return new Response(null, { status: 204 });
}
