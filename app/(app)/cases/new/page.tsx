import { redirect } from "next/navigation";

import { authorize } from "@/app/lib/authorize";
import { FirRegisterForm } from "./fir-register-form";

// D-12/D-13: only Police (and Admin) can register an FIR. The role check
// runs BEFORE calling authorize()'s own redirecting branch so a non-Police/
// Admin caller sees the explicit /access-denied 403 page (D-13) instead of
// authorize()'s Phase-1-default /dashboard redirect — a page-level branch,
// not a change to authorize()'s redirect target for every caller
// (02-PATTERNS.md).
export default async function NewCasePage() {
  const user = await authorize();
  if (user.role !== "POLICE" && user.role !== "ADMIN") {
    redirect("/access-denied");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Register FIR</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FirRegisterForm />
      </div>
    </div>
  );
}
