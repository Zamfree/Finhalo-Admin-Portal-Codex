"use client";

import { usePathname } from "next/navigation";

function getTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    return "Admin";
  }

  const section = segments[1];

  if (section === "ib") {
    return "IB Network";
  }

  return section.charAt(0).toUpperCase() + section.slice(1);
}

export function AdminTopbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <h1 className="text-base font-semibold">{getTitle(pathname)}</h1>
      <span className="text-sm text-muted-foreground">Admin</span>
    </header>
  );
}
