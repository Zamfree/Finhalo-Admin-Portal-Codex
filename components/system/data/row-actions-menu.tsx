"use client";

import * as React from "react";
import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";

type RowActionItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export function RowActionsMenu({ items }: { items: RowActionItem[] }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-end"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="admin-interactive inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-zinc-300 hover:text-white"
      >
        ...
      </button>

      {open ? (
        <div className="admin-surface-soft absolute right-0 top-11 z-20 min-w-44 space-y-1 rounded-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {items.map((item) =>
            item.href && !item.disabled ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block"
              >
                <AdminButton variant="ghost" className="w-full justify-start px-3 py-2 normal-case tracking-normal">
                  {item.label}
                </AdminButton>
              </Link>
            ) : (
              <AdminButton
                key={item.label}
                variant="ghost"
                className="w-full justify-start px-3 py-2 normal-case tracking-normal"
                disabled
              >
                {item.label}
              </AdminButton>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
