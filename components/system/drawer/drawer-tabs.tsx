"use client";

import { cn } from "@/lib/utils";

type DrawerTabsProps<T extends string> = {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  getLabel: (tab: T) => string;
};

export function DrawerTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  getLabel,
}: DrawerTabsProps<T>) {
  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                isActive
                  ? "bg-white text-black"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
              )}
            >
              {getLabel(tab)}
            </button>
          );
        })}
      </div>
    </div>
  );
}