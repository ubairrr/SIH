import { authorize } from "@/app/lib/authorize";
import { FirRegisterForm } from "./fir-register-form";

// D-12: only Police (and Admin) can register an FIR. This is the only
// page-level access check for now — a non-Police/Admin caller gets the
// Phase-1 default authorize() redirect to /dashboard (Plan 02-02 upgrades
// this to a proper /access-denied 403 page).
export default async function NewCasePage() {
  await authorize({ role: ["POLICE", "ADMIN"] });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Register FIR</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FirRegisterForm />
      </div>
    </div>
  );
}
