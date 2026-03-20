import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminContainer } from "@/components/admin/container";
import { AdminTopbar } from "@/components/admin/topbar";

type AdminAppShellProps = {
  children: ReactNode;
};

export function AdminAppShell({ children }: AdminAppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#0B0F14] text-slate-100">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <AdminContainer>{children}</AdminContainer>
      </div>
    </div>
  );
}
