import type { Case, User } from "@prisma/client";

type CaseWithRegisteredBy = Case & {
  registeredBy: Pick<User, "fullName">;
};

const VERDICT_LABELS: Record<string, string> = {
  CONVICTED: "Convicted",
  ACQUITTED: "Acquitted",
  DISCHARGED: "Discharged",
  COMPOUNDED: "Compounded",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// 02-UI-SPEC.md "Metadata definition grid": dt = text-xs uppercase
// text-slate-500, dd = text-sm text-slate-900 break-words (FIR number dd
// additionally monospace). D-14 fields plus the verdict/judgment-summary
// pair, which only populate at CLOSED_JUDGMENT (E4 "partial": null optional
// values render "—").
export function CaseMetadataGrid({ kase }: { kase: CaseWithRegisteredBy }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase text-slate-500">FIR Number</dt>
        <dd className="break-words font-mono text-sm text-slate-900">
          {kase.firNumber}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Police Station</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.policeStation || "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase text-slate-500">Title</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.title || "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase text-slate-500">
          Offence / Sections
        </dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.offenceSections || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Incident Date</dt>
        <dd className="break-words text-sm text-slate-900">
          {formatDate(kase.incidentDate)}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Registered By</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.registeredBy.fullName || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Complainant</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.complainant || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Accused</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.accused || "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase text-slate-500">Description</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.description || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase text-slate-500">Verdict</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.verdict ? VERDICT_LABELS[kase.verdict] : "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase text-slate-500">Judgment Summary</dt>
        <dd className="break-words text-sm text-slate-900">
          {kase.judgmentSummary || "—"}
        </dd>
      </div>
    </dl>
  );
}
