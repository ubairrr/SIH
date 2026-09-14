"use client";

import { useState, useTransition } from "react";

import {
  testTamperProtection,
  type TamperTestResult,
} from "@/app/actions/audit";

// D-13/E8: before the first run, only a one-line explanation and the
// button (no result area). While running, the button reads "Testing…" and
// is disabled. On the expected outcome (both statements rejected), shows
// the verbatim Postgres errors and "Row unchanged". If either statement
// unexpectedly succeeded, shows a distinct "Tamper protection NOT active"
// warning — never a silent pass (LOG-02: honest-verifier discipline).
export function TamperTestPanel() {
  const [result, setResult] = useState<TamperTestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runTest() {
    startTransition(async () => {
      const nextResult = await testTamperProtection();
      setResult(nextResult);
    });
  }

  const ranAgainstRow = result !== null && result.ranAgainstRow !== null;
  const rejected = ranAgainstRow && !result.tamperSucceeded;
  const tamperSucceeded = ranAgainstRow && result.tamperSucceeded === true;
  const emptyLog = result !== null && result.ranAgainstRow === null;

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-300">
        Attempts a live UPDATE and DELETE against the most recent audit log
        row and shows the database&apos;s rejection.
      </p>

      <button
        type="button"
        onClick={runTest}
        disabled={isPending}
        className="mt-3 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white outline-none focus:border-teal-400 disabled:opacity-50"
      >
        {isPending ? "Testing…" : "Test tamper-protection"}
      </button>

      {rejected && (
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-4">
          <p className="font-semibold text-slate-100">
            Tamper attempt rejected
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-slate-400">
            {result?.updateError}
          </pre>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-slate-400">
            {result?.deleteError}
          </pre>
          <p className="mt-2 text-sm text-emerald-300">Row unchanged</p>
          <p className="mt-3 text-xs text-slate-500">
            This demonstrates the database rejecting these two statements
            through the app&apos;s own connection.
          </p>
        </div>
      )}

      {tamperSucceeded && (
        <div className="mt-4 rounded-md border border-red-800 bg-red-950 p-4">
          <p className="font-semibold text-red-300">
            Tamper protection NOT active
          </p>
          {result?.updateError && (
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-slate-400">
              {result.updateError}
            </pre>
          )}
          {result?.deleteError && (
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-slate-400">
              {result.deleteError}
            </pre>
          )}
        </div>
      )}

      {emptyLog && (
        <p className="mt-4 text-sm text-slate-400">
          No audit log rows exist yet — perform an action (e.g. create a
          user), then try again.
        </p>
      )}
    </div>
  );
}
