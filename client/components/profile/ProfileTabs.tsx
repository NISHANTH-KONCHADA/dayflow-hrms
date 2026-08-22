"use client";

import { cn } from "@/lib/cn";

export type ProfileTabId = "profile" | "private" | "resume" | "skills" | "certifications" | "salary";

interface Tab {
  id: ProfileTabId;
  label: string;
}

const BASE_TABS: Tab[] = [
  { id: "profile", label: "My Profile" },
  { id: "private", label: "Private Info" },
  { id: "resume", label: "Resume" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certification" },
];

const SALARY_TAB: Tab = { id: "salary", label: "Salary Info" };

interface ProfileTabsProps {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
  showSalaryTab: boolean;
}

export default function ProfileTabs({ active, onChange, showSalaryTab }: ProfileTabsProps) {
  const tabs = showSalaryTab ? [...BASE_TABS, SALARY_TAB] : BASE_TABS;

  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
