"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  className?: string;
};

export function AdminSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
}: AdminSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={`admin-control group flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm text-zinc-200 outline-none transition-all duration-200 ${className}`}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-zinc-500 transition-colors duration-200 group-hover:text-zinc-300">
          <ChevronDown className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          sideOffset={8}
          className="z-50 min-w-[8rem] overflow-hidden rounded-xl bg-zinc-950/95 p-1 shadow-[0_16px_40px_rgba(0,0,0,0.38)] ring-1 ring-white/8 backdrop-blur-xl"
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="
                  relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2
                  text-sm text-zinc-300 outline-none transition-all duration-150

                  data-[highlighted]:bg-white/[0.03]
                  data-[highlighted]:text-zinc-100

                  data-[state=checked]:bg-white/[0.075]
                  data-[state=checked]:text-white
                  data-[state=checked]:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.05)]
                "
              >
                <Select.ItemText>{option.label}</Select.ItemText>

                <span className="ml-auto flex items-center text-zinc-400">
                  <Select.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </span>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}