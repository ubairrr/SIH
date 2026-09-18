"use client";

import { useActionState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { Case } from "@prisma/client";

import { updateCaseDetails, type UpdateCaseState } from "@/app/actions/cases";
import { updateCaseSchema } from "@/app/lib/validation/case";

// z.input (not z.infer) — the pre-coercion shape, matching the
// RegisterFirInput decision in Plan 02-01 (incidentDate uses
// z.coerce.date(), which diverges the schema's client/server types).
type EditCaseFormInput = z.input<typeof updateCaseSchema>;

const INPUT_CLASSES =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// D-18/E10: opens prefilled with the case's current values; a closed-case
// rejection (D-12 copy) or any unexpected server error renders in the
// generic red-50/red-800 banner; entered values persist after an error
// (react-hook-form keeps its own state — only a success clears the form via
// router.refresh() re-rendering the parent Server Component with fresh
// defaultValues).
export function EditCaseForm({ kase }: { kase: Case }) {
  const [state, formAction, pending] = useActionState<
    UpdateCaseState,
    FormData
  >(updateCaseDetails, undefined);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditCaseFormInput>({
    resolver: zodResolver(updateCaseSchema),
    defaultValues: {
      caseId: kase.id,
      title: kase.title,
      offenceSections: kase.offenceSections,
      policeStation: kase.policeStation,
      complainant: kase.complainant,
      accused: kase.accused,
      description: kase.description,
    },
  });

  useEffect(() => {
    if (state?.fieldErrors) {
      for (const [field, message] of Object.entries(state.fieldErrors)) {
        if (message) {
          setError(field as keyof EditCaseFormInput, { message });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const showBanner = state?.error && !state.fieldErrors;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("caseId", kase.id);
        formData.set("title", values.title);
        formData.set("offenceSections", values.offenceSections);
        formData.set("incidentDate", String(values.incidentDate));
        formData.set("policeStation", values.policeStation);
        formData.set("complainant", values.complainant);
        formData.set("accused", values.accused);
        formData.set("description", values.description);
        formAction(formData);
      })}
    >
      <input type="hidden" {...register("caseId")} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-1">
          <label
            htmlFor="title"
            className="text-sm font-semibold text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            className={INPUT_CLASSES}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-red-700">{errors.title.message}</p>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label
            htmlFor="offenceSections"
            className="text-sm font-semibold text-slate-700"
          >
            Offence / sections
          </label>
          <input
            id="offenceSections"
            type="text"
            className={INPUT_CLASSES}
            {...register("offenceSections")}
          />
          {errors.offenceSections && (
            <p className="text-sm text-red-700">
              {errors.offenceSections.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="incidentDate"
            className="text-sm font-semibold text-slate-700"
          >
            Incident date
          </label>
          <input
            id="incidentDate"
            type="date"
            defaultValue={toDateInputValue(kase.incidentDate)}
            className={INPUT_CLASSES}
            {...register("incidentDate")}
          />
          {errors.incidentDate && (
            <p className="text-sm text-red-700">
              {errors.incidentDate.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="policeStation"
            className="text-sm font-semibold text-slate-700"
          >
            Police station
          </label>
          <input
            id="policeStation"
            type="text"
            className={INPUT_CLASSES}
            {...register("policeStation")}
          />
          {errors.policeStation && (
            <p className="text-sm text-red-700">
              {errors.policeStation.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="complainant"
            className="text-sm font-semibold text-slate-700"
          >
            Complainant
          </label>
          <input
            id="complainant"
            type="text"
            className={INPUT_CLASSES}
            {...register("complainant")}
          />
          {errors.complainant && (
            <p className="text-sm text-red-700">
              {errors.complainant.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="accused"
            className="text-sm font-semibold text-slate-700"
          >
            Accused
          </label>
          <input
            id="accused"
            type="text"
            className={INPUT_CLASSES}
            {...register("accused")}
          />
          {errors.accused && (
            <p className="text-sm text-red-700">{errors.accused.message}</p>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label
            htmlFor="description"
            className="text-sm font-semibold text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className={INPUT_CLASSES}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-700">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {showBanner && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
