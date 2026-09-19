"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateDocumentMetadata } from "@/app/actions/documents";
import {
  ErrorBanner,
  BUTTON_CLASSES,
  CANCEL_CLASSES,
  TEXTAREA_CLASSES,
} from "./case-detail-client";

// D-12 platform-wide view/Edit rule, applied here to document metadata —
// the exact same toggle pattern 03-03 retrofitted onto edit-case-form.tsx.
// Category/Type has no edit path (updateDocumentMetadataSchema only covers
// title/description) and always renders read-only. The Edit button is
// entirely ABSENT (not disabled) when `canEdit` is false — the caller
// (the viewer page) computes `canEdit` server-side from D-08's ownership
// rule (uploadedByRole === session.role || ADMIN) and the case's closed
// state; this component never re-derives that check itself.
export function DocumentMetadataCard({
  documentId,
  title,
  description,
  typeLabel,
  isCategory,
  canEdit,
}: {
  documentId: string;
  title: string;
  description: string | null;
  typeLabel: string;
  isCategory: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [titleValue, setTitleValue] = useState(title);
  const [descriptionValue, setDescriptionValue] = useState(description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = titleValue.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      const result = await updateDocumentMetadata({
        documentId,
        title: titleValue,
        description: descriptionValue.trim() ? descriptionValue : undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode("view");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  if (mode === "view") {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Document Details
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={CANCEL_CLASSES}
            >
              Edit
            </button>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-slate-500">Title</dt>
            <dd className="break-words text-sm text-slate-900">
              {title || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">
              {isCategory ? "Category" : "Type"}
            </dt>
            <dd className="break-words text-sm text-slate-900">
              {typeLabel}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-slate-500">Description</dt>
            <dd className="break-words text-sm text-slate-900">
              {description || "—"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Document Details
      </h2>
      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="doc-title"
            className="text-sm font-semibold text-slate-700"
          >
            Title
          </label>
          <input
            id="doc-title"
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            className={TEXTAREA_CLASSES}
          />
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">
            {isCategory ? "Category" : "Type"}
          </p>
          <p className="mt-1 text-sm text-slate-900">{typeLabel}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="doc-description"
            className="text-sm font-semibold text-slate-700"
          >
            Description
          </label>
          <textarea
            id="doc-description"
            rows={3}
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            className={TEXTAREA_CLASSES}
          />
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !canSubmit}
            className={BUTTON_CLASSES}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            disabled={pending}
            className={CANCEL_CLASSES}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
