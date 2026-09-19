import { authorize } from "@/app/lib/authorize";
import { LocalDiskStorageAdapter } from "@/app/lib/storage/local";
import { isValidStorageKeyShape } from "@/app/lib/storage/key";

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

  try {
    await authorize();
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

  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";

  const adapter = new LocalDiskStorageAdapter();
  await adapter.putObject(key, buffer, contentType);

  return new Response(null, { status: 204 });
}
