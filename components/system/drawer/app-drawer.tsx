"use client";

import * as React from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AppDrawerWidth = "narrow" | "default" | "wide" | "xl";

const DRAWER_WIDTH: Record<AppDrawerWidth, string> = {
  narrow: "640px",
  default: "960px",
  wide: "1040px",
  xl: "1200px",
};

type AppDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  width?: AppDrawerWidth;
  children: React.ReactNode;
  className?: string;
};

export function AppDrawer({
  open,
  onOpenChange,
  title,
  width = "default",
  children,
  className,
}: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ "--drawer-width": DRAWER_WIDTH[width] } as React.CSSProperties}
        className={cn(
          "flex h-full flex-col overflow-hidden border-white/[0.04] bg-[#101010] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.6)] [&>button]:hidden",
          className
        )}
      >
        <VisuallyHidden>
          <SheetTitle>{title}</SheetTitle>
        </VisuallyHidden>

        {children}
      </SheetContent>
    </Sheet>
  );
}