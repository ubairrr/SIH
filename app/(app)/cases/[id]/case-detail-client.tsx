"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, Stage } from "@prisma/client";

import { advanceStage, closeCase, reopenCase } from "@/app/actions/cases";
import {
  advanceStageSchema,
  closeCaseSchema,
  reopenCaseSchema,
} from "@/app/lib/validation/case";
import { nextStageOf, STAGE_OWNER } from "@/app/lib/case-guards";
import { STAGE_LABELS } from "@/app/lib/role-display";

type VerdictValue = "CONVICTED" | "ACQUITTED" | "DISCHARGED" | "COMPOUNDED";

const VERDICT_OPTIONS: { value: VerdictValue; label: string }[] = [
  { value: "CONVICTED", label: "Convicted" },
  { value: "ACQUITTED", label: "Acquitted" },
  { value: "DISCHARGED", label: "Discharged" },
  { value: "COMPOUNDED", label: "Compounded" },
];

const BUTTON_CLASSES =
  "rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60";
const CANCEL_CLASSES =
  "rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60";
const TEXTAREA_CLASSES =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500";

// Same local-useState pending/error + direct-async-Server-Action-call
// pattern as users-page-client.tsx's Dialog/ChangeRoleDialog/
// ToggleActiveDialog — but light-themed per 02-UI-SPEC.md.
function Dialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        {children}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default"
      />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

function AdvanceStageDialog({
  caseId,
  firNumber,
  nextStage,
  onClose,
  onSuccess,
}: {
  caseId: string;
  firNumber: string;
  nextStage: Stage;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [remark, setRemark] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remarkCheck = advanceStageSchema.shape.remark.safeParse(
    remark.length > 0 ? remark : undefined,
  );
  const remarkError = !remarkCheck.success
    ? (remarkCheck.error.issues[0]?.message ?? "Remark is too long.")
    : null;

  const handleConfirm = async () => {
    if (remarkError) return;
    setPending(true);
    setError(null);
    try {
      const result = await advanceStage(
        caseId,
        remark.length > 0 ? remark : undefined,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog onClose={onClose}>
      <p className="break-words text-sm font-semibold text-slate-900">
        Advance {firNumber} to {STAGE_LABELS[nextStage]}?
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <label
          htmlFor="advance-remark"
          className="text-sm font-semibold text-slate-700"
        >
          Remark (optional)
        </label>
        <textarea
          id="advance-remark"
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className={TEXTAREA_CLASSES}
        />
        {remarkError && <p className="text-sm text-red-700">{remarkError}</p>}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={CANCEL_CLASSES}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || !!remarkError}
          className={BUTTON_CLASSES}
        >
          {pending ? "Advancing…" : "Confirm advance"}
        </button>
      </div>
    </Dialog>
  );
}

function CloseCaseDialog({
  caseId,
  firNumber,
  onClose,
  onSuccess,
}: {
  caseId: string;
  firNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [verdict, setVerdict] = useState<VerdictValue | "">("");
  const [summary, setSummary] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaryCheck = closeCaseSchema.shape.judgmentSummary.safeParse(
    summary,
  );
  const summaryError =
    summary.length > 0 && !summaryCheck.success
      ? (summaryCheck.error.issues[0]?.message ?? "Summary is too long.")
      : null;

  const canSubmit = !!verdict && summary.trim().length > 0 && !summaryError;

  const handleConfirm = async () => {
    if (!canSubmit || !verdict) return;
    setPending(true);
    setError(null);
    try {
      const result = await closeCase(caseId, verdict, summary);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog onClose={onClose}>
      <p className="break-words text-sm font-semibold text-slate-900">
        Record judgment for {firNumber}?
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <label
          htmlFor="close-verdict"
          className="text-sm font-semibold text-slate-700"
        >
          Verdict
        </label>
        <select
          id="close-verdict"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value as VerdictValue)}
          className={TEXTAREA_CLASSES}
        >
          <option value="" disabled>
            Select verdict
          </option>
          {VERDICT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label
          htmlFor="close-summary"
          className="text-sm font-semibold text-slate-700"
        >
          Judgment summary
        </label>
        <textarea
          id="close-summary"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={TEXTAREA_CLASSES}
        />
        {summaryError && (
          <p className="text-sm text-red-700">{summaryError}</p>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={CANCEL_CLASSES}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || !canSubmit}
          className={BUTTON_CLASSES}
        >
          {pending ? "Recording…" : "Record judgment"}
        </button>
      </div>
    </Dialog>
  );
}

function ReopenCaseDialog({
  caseId,
  firNumber,
  onClose,
  onSuccess,
}: {
  caseId: string;
  firNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonCheck = reopenCaseSchema.shape.reason.safeParse(reason);
  const reasonError =
    reason.length > 0 && !reasonCheck.success
      ? (reasonCheck.error.issues[0]?.message ?? "Reason is too long.")
      : null;

  const canSubmit = reason.trim().length > 0 && !reasonError;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      const result = await reopenCase(caseId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog onClose={onClose}>
      <p className="break-words text-sm font-semibold text-slate-900">
        Reopen {firNumber}?
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <label
          htmlFor="reopen-reason"
          className="text-sm font-semibold text-slate-700"
        >
          Reason for reopening
        </label>
        <textarea
          id="reopen-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={TEXTAREA_CLASSES}
        />
        {reasonError && <p className="text-sm text-red-700">{reasonError}</p>}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={CANCEL_CLASSES}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || !canSubmit}
          className={BUTTON_CLASSES}
        >
          {pending ? "Reopening…" : "Reopen case"}
        </button>
      </div>
    </Dialog>
  );
}

// The top-level action button is rendered ONLY when the current user's role
// matches STAGE_OWNER[stage] or is Admin (or, for reopen, Court/Admin on a
// closed case) — a UX nicety, NOT the enforcement. Every dialog's underlying
// Server Action re-runs authorize() + case-guards.ts regardless of what the
// client rendered (D-13, T-02-06).
export function CaseDetailClient({
  caseId,
  firNumber,
  stage,
  role,
}: {
  caseId: string;
  firNumber: string;
  stage: Stage;
  role: Role;
}) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<
    "advance" | "close" | "reopen" | null
  >(null);

  const handleSuccess = () => {
    setOpenDialog(null);
    router.refresh();
  };

  if (stage === "CLOSED_JUDGMENT") {
    const canReopen = role === "COURT" || role === "ADMIN";
    if (!canReopen) return null;
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenDialog("reopen")}
          className={BUTTON_CLASSES}
        >
          Reopen case
        </button>
        {openDialog === "reopen" && (
          <ReopenCaseDialog
            caseId={caseId}
            firNumber={firNumber}
            onClose={() => setOpenDialog(null)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    );
  }

  const owner = STAGE_OWNER[stage];
  const canAct = role === owner || role === "ADMIN";
  const nextStage = nextStageOf(stage);

  if (!canAct || !nextStage) {
    return null;
  }

  const isClosing = nextStage === "CLOSED_JUDGMENT";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpenDialog(isClosing ? "close" : "advance")}
        className={BUTTON_CLASSES}
      >
        {isClosing ? "Record judgment" : `Advance to ${STAGE_LABELS[nextStage]}`}
      </button>

      {openDialog === "advance" && (
        <AdvanceStageDialog
          caseId={caseId}
          firNumber={firNumber}
          nextStage={nextStage}
          onClose={() => setOpenDialog(null)}
          onSuccess={handleSuccess}
        />
      )}
      {openDialog === "close" && (
        <CloseCaseDialog
          caseId={caseId}
          firNumber={firNumber}
          onClose={() => setOpenDialog(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
