import { LoginForm } from "./login-form";

export default function LoginPage() {
  // D-17: the Demo Accounts panel is rendered only when DEMO_MODE is on —
  // only the resulting boolean crosses into the client bundle, never the
  // env var itself.
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          CaseVault — Secure Case Records
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Sign in with your department account.
        </p>
        <LoginForm demoMode={demoMode} />
      </div>
    </main>
  );
}
