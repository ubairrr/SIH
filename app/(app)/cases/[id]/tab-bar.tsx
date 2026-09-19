"use client";

import Link from "next/link";

// D-13: URL-synced tab bar. Plain `<Link href={`?tab=${key}`}>` entries — no
// client-side state, no JS-driven active-tab tracking. The active tab is
// derived server-side (page.tsx reads searchParams.tab) and passed in as
// `activeTab`, so a hard refresh, back button, or direct deep link to
// `?tab=documents` all render the same tab with zero client hydration
// flicker. Documents/Evidence entries are added to the same `tabs` array
// literal by 03-04 — this component itself needs no changes for that.
export type CaseTab = { key: string; label: string };

export function TabBar({
  tabs,
  activeTab,
}: {
  tabs: CaseTab[];
  activeTab: string;
}) {
  return (
    <div className="flex gap-6 border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={`?tab=${tab.key}`}
            className={
              isActive
                ? "border-b-2 border-blue-700 px-1 py-3 text-sm font-semibold text-blue-700"
                : "border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
