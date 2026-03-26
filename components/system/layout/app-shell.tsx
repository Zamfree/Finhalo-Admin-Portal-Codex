import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/system/layout/sidebar/sidebar";
import { AdminContainer } from "@/components/system/layout/container";
import { AdminTopbar } from "@/components/system/layout/topbar";

type AdminAppShellProps = {
  children: ReactNode;
};

export function AdminAppShell({ children }: AdminAppShellProps) {
  return (
    <div className="admin-shell flex h-screen overflow-hidden text-slate-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <AdminContainer>{children}</AdminContainer>
      </div>
    </div>
  );
}
