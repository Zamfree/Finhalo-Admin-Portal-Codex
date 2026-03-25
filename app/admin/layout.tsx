import type { ReactNode } from "react";

import { AdminAppShell } from "@/components/system/layout/app-shell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminAppShell>{children}</AdminAppShell>;
}