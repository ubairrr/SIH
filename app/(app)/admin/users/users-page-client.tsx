"use client";

import { useActionState, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Role } from "@prisma/client";

import { createUser, type CreateUserState } from "@/app/actions/users";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/app/lib/validation/user";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/app/lib/role-display";

export type AdminUserRow = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  designation: string | null;
  unit: string | null;
  badgeId: string | null;
  isActive: boolean;
};

const ROLE_OPTIONS: Role[] = [
  "POLICE",
  "FORENSICS",
  "PROSECUTION",
  "COURT",
  "ADMIN",
];

function Cell({ value }: { value: string | null | undefined }) {
  return (
    <span className="truncate" title={value ?? undefined}>
      {value && value.length > 0 ? value : "—"}
    </span>
  );
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<
    CreateUserState,
    FormData
  >(createUser, undefined);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      designation: "",
      unit: "",
      badgeId: "",
      initialPassword: "",
    },
  });

  useEffect(() => {
    if (state?.success) {
      reset();
      onSuccess();
      return;
    }
    if (state?.fieldErrors) {
      for (const [field, message] of Object.entries(state.fieldErrors)) {
        if (message) {
          setError(field as keyof CreateUserInput, { message });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const showBanner = state?.error && !state.fieldErrors;

  return (
    <form
      className="mt-4 flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-xl"
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("fullName", values.fullName);
        formData.set("username", values.username);
        formData.set("role", values.role);
        formData.set("designation", values.designation);
        formData.set("unit", values.unit);
        formData.set("badgeId", values.badgeId);
        formData.set("initialPassword", values.initialPassword);
        formAction(formData);
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="fullName"
            className="text-sm font-semibold text-slate-200"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-sm text-amber-400">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="username"
            className="text-sm font-semibold text-slate-200"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="off"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-sm text-amber-400">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="role"
            className="text-sm font-semibold text-slate-200"
          >
            Role
          </label>
          <select
            id="role"
            defaultValue=""
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("role")}
          >
            <option value="" disabled>
              Select role
            </option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-sm text-amber-400">{errors.role.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="designation"
            className="text-sm font-semibold text-slate-200"
          >
            Designation
          </label>
          <input
            id="designation"
            type="text"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("designation")}
          />
          {errors.designation && (
            <p className="text-sm text-amber-400">
              {errors.designation.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="unit"
            className="text-sm font-semibold text-slate-200"
          >
            Unit
          </label>
          <input
            id="unit"
            type="text"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("unit")}
          />
          {errors.unit && (
            <p className="text-sm text-amber-400">{errors.unit.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="badgeId"
            className="text-sm font-semibold text-slate-200"
          >
            Badge ID
          </label>
          <input
            id="badgeId"
            type="text"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("badgeId")}
          />
          {errors.badgeId && (
            <p className="text-sm text-amber-400">
              {errors.badgeId.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="initialPassword"
            className="text-sm font-semibold text-slate-200"
          >
            Initial password
          </label>
          <input
            id="initialPassword"
            type="text"
            autoComplete="off"
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
            {...register("initialPassword")}
          />
          {errors.initialPassword && (
            <p className="text-sm text-amber-400">
              {errors.initialPassword.message}
            </p>
          )}
        </div>
      </div>

      {showBanner && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

export function AdminUsersPageClient({
  users,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Users</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-md bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-500"
        >
          {showCreateForm ? "Cancel" : "Create user"}
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm onSuccess={() => setShowCreateForm(false)} />
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Full name
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Username
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Role
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Unit
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Status
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="max-w-[200px] truncate px-3 py-2 text-slate-100">
                  <Cell value={user.fullName} />
                </td>
                <td className="px-3 py-2 text-slate-300">{user.username}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[user.role]}`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="max-w-[160px] truncate px-3 py-2 text-slate-300">
                  <Cell value={user.unit} />
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      user.isActive
                        ? "rounded-full border border-emerald-700 bg-emerald-900/60 px-2 py-1 text-xs font-semibold text-emerald-200"
                        : "rounded-full border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {/* Row lifecycle controls wired up in Task 3 */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
