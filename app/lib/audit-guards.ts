// D-13: pure, side-effect-free branch-decision helper for
// testTamperProtection's result shape — no Prisma/Next imports, runs under
// plain node:test with no live database. The extracted decision: "both the
// UPDATE and DELETE threw" is the expected success-rejection outcome;
// anything else is an unexpected tamper success that must be surfaced as a
// distinct failure state, never silently folded into the rejection branch.
export function summarizeTamperResult(input: {
  updateThrew: boolean;
  deleteThrew: boolean;
}): { tamperSucceeded: boolean } {
  const { updateThrew, deleteThrew } = input;
  return { tamperSucceeded: !(updateThrew && deleteThrew) };
}
