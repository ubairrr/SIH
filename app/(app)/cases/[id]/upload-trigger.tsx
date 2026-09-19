"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BUTTON_CLASSES } from "./case-detail-client";
import { UploadDialog, type UploadKind } from "./upload-dialog";

// Thin client wrapper around UploadDialog for the Documents/Evidence tabs'
// top-right "Upload document"/"Upload evidence" button (Phase 2's "action
// reads as page-level" convention). Documents/EvidenceTab render this only
// when the case is not closed — entirely absent, never merely disabled.
export function UploadTrigger({
  caseId,
  kind,
  label,
}: {
  caseId: string;
  kind: UploadKind;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={BUTTON_CLASSES}>
        {label}
      </button>
      {open && (
        <UploadDialog
          caseId={caseId}
          kind={kind}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
