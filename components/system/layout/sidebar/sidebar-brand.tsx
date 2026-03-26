"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SidebarBrandProps = {
  subtitle?: string;
  logo?: React.ReactNode;
  className?: string;
};

export function SidebarBrand({
  subtitle = "Admin Portal",
  logo,
  className,
}: SidebarBrandProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-center justify-center">
        {logo ?? (
          <Image
            src="/finhalo-logo.gif"
            alt="Finhalo logo"
            width={168}
            height={56}
            className="h-14 w-auto object-contain"
          />
        )}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}
