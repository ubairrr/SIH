"use client";

import { useState } from "react";

import { BUTTON_CLASSES } from "../../case-detail-client";

export type MediaKind = "pdf" | "image" | "video" | "audio";

// Inline media preview with an onError fallback — required for
// <img>/<video>/<audio> (Server Components can't attach event handlers,
// hence this client component), per the Copywriting Contract's viewer
// error state. <embed> (PDF) needs no error handler but is co-located here
// for a single previewable-media entry point.
export function MediaPreview({
  kind,
  previewUrl,
  downloadUrl,
}: {
  kind: MediaKind;
  previewUrl: string;
  downloadUrl: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-slate-700">
          Couldn&rsquo;t load this file — try Download.
        </p>
        <a href={downloadUrl} download className={BUTTON_CLASSES}>
          Download
        </a>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <embed
        src={previewUrl}
        type="application/pdf"
        className="max-h-[70vh] w-full"
      />
    );
  }
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={previewUrl}
        alt=""
        className="max-h-[70vh] w-full object-contain"
        onError={() => setFailed(true)}
      />
    );
  }
  if (kind === "video") {
    return (
      <video
        controls
        src={previewUrl}
        className="max-h-[70vh] w-full"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <audio
      controls
      src={previewUrl}
      className="w-full"
      onError={() => setFailed(true)}
    />
  );
}
