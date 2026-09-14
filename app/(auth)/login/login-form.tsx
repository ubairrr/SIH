"use client";

import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { login, type LoginState } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/app/lib/validation/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("username", values.username);
        formData.set("password", values.password);
        formAction(formData);
      })}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium text-slate-200">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
          {...register("username")}
        />
        {errors.username && (
          <p className="text-sm text-amber-400">{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-200">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-amber-400">{errors.password.message}</p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-teal-600 px-4 py-2 font-medium text-white transition hover:bg-teal-500 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
