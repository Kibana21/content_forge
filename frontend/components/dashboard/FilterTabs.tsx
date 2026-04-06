"use client";
import { clsx } from "clsx";

export type FilterTab = "all" | "draft" | "exported" | "in_review";

interface FilterTabsProps {
  active: FilterTab;
  counts: Record<FilterTab, number>;
  onChange: (tab: FilterTab) => void;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "exported", label: "Exported" },
  { key: "in_review", label: "In Review" },
];

export function FilterTabs({ active, counts, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={clsx("filter-tab", active === tab.key && "active")}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          <span style={{ marginLeft: 6, opacity: 0.6 }}>({counts[tab.key]})</span>
        </button>
      ))}
    </div>
  );
}
