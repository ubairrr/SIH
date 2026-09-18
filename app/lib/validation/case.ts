import { z } from "zod";

// D-14..D-17: FIR fields are free text except firNumber, manually typed and
// DB-unique. Max lengths match 02-UI-SPEC.md's E3/E10 long-text resolutions.
export const stageEnum = z.enum([
  "FIR_REGISTERED",
  "UNDER_INVESTIGATION",
  "CHARGE_SHEET_FILED",
  "IN_COURT",
  "CLOSED_JUDGMENT",
]);

export const verdictEnum = z.enum([
  "CONVICTED",
  "ACQUITTED",
  "DISCHARGED",
  "COMPOUNDED",
]);

// Shared between the client Register FIR form (react-hook-form + zodResolver)
// and registerFir's Server Action (authoritative re-validation) — never
// trust client validation alone (D-14 fields).
export const registerFirSchema = z.object({
  firNumber: z.string().min(1, "FIR number is required").max(50),
  title: z.string().min(1, "Title is required").max(200),
  offenceSections: z.string().min(1, "Offence/sections is required").max(500),
  incidentDate: z.coerce.date(),
  policeStation: z.string().min(1, "Police station is required").max(100),
  complainant: z.string().min(1, "Complainant is required").max(300),
  accused: z.string().min(1, "Accused is required").max(300),
  description: z.string().min(1, "Description is required").max(2000),
});

// z.input (not z.infer) — the client form works with the pre-coercion shape
// (incidentDate is a string from a native <input type="date">) since
// z.coerce.date() makes the schema's INPUT and OUTPUT types diverge.
export type RegisterFirInput = z.input<typeof registerFirSchema>;

// D-06/D-09: stage-forward move, optional remark saved to stage history and
// log details.
export const advanceStageSchema = z.object({
  caseId: z.string().min(1),
  remark: z.string().max(1000).optional(),
});

export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;

// D-07: closing a case (IN_COURT -> CLOSED_JUDGMENT) requires a verdict from
// the fixed list plus a judgment summary.
export const closeCaseSchema = z.object({
  caseId: z.string().min(1),
  verdict: verdictEnum,
  judgmentSummary: z
    .string()
    .min(1, "Judgment summary is required")
    .max(2000),
});

export type CloseCaseInput = z.infer<typeof closeCaseSchema>;

// D-08: Court (or Admin) reopening a closed case requires a non-empty reason.
export const reopenCaseSchema = z.object({
  caseId: z.string().min(1),
  reason: z.string().min(1, "A reason is required").max(1000),
});

export type ReopenCaseInput = z.infer<typeof reopenCaseSchema>;

// D-18: case details are editable by any department until closed. firNumber
// is immutable after registration — it is the case's identifier and DB
// unique key, so it is intentionally excluded here.
export const updateCaseSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  offenceSections: z.string().min(1, "Offence/sections is required").max(500),
  incidentDate: z.coerce.date(),
  policeStation: z.string().min(1, "Police station is required").max(100),
  complainant: z.string().min(1, "Complainant is required").max(300),
  accused: z.string().min(1, "Accused is required").max(300),
  description: z.string().min(1, "Description is required").max(2000),
});

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
