import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#090909] text-zinc-100">
      <AdminSidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <AdminTopbar />
        <main className="relative z-10 flex-1 overflow-auto px-6 pb-12 pt-4 md:px-10 md:pt-6">{children}</main>
      </div>
    </div>
  );
}
