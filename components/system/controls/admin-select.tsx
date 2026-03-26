"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

import type { SelectOption } from "@/types/system/option";

type AdminSelectProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
};

export function AdminSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
}: AdminSelectProps<T>) {
  return (
    <Select.Root
      value={value}
      onValueChange={(val) => onValueChange(val as T)}
    >
      <Select.Trigger
        className={`admin-control group flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm text-zinc-200 outline-none transition-colors duration-150 ${className}`}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-zinc-500 transition-colors duration-150 group-hover:text-zinc-300">
          <ChevronDown className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          sideOffset={8}
          className="admin-surface z-50 min-w-[12rem] overflow-hidden rounded-2xl p-1.5"
        >
          <Select.Viewport className="p-0.5">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="
                  relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2.5
                  text-sm text-zinc-300 outline-none transition-colors duration-150

                  data-[highlighted]:bg-white/[0.05]
                  data-[highlighted]:text-zinc-100

                  data-[state=checked]:bg-white/[0.08]
                  data-[state=checked]:text-white
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
