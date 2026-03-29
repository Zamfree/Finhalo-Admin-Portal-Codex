"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminButton } from "@/components/system/actions/admin-button";

import { SupportBroadcastActions } from "./support-broadcast-actions";
import { SupportPageClient } from "./support-page-client";
import type {
  SupportAnnouncement,
  SupportOutboundMessage,
  SupportTicket,
  SupportTicketTimelineItem,
} from "./_types";

type SupportWorkbenchClientProps = {
  rows: SupportTicket[];
  timelineByTicket: Record<string, SupportTicketTimelineItem[]>;
  announcements: SupportAnnouncement[];
  outboundMessages: SupportOutboundMessage[];
};

type SupportModuleTab = "queue" | "broadcast";

export function SupportWorkbenchClient({
  rows,
  timelineByTicket,
  announcements,
  outboundMessages,
}: SupportWorkbenchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SupportModuleTab>(() =>
    searchParams.get("module_tab") === "broadcast" ? "broadcast" : "queue"
  );

  useEffect(() => {
    const tab = searchParams.get("module_tab");
    const nextTab: SupportModuleTab = tab === "broadcast" ? "broadcast" : "queue";
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

  function switchTab(tab: SupportModuleTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "queue") {
      params.delete("module_tab");
    } else {
      params.set("module_tab", tab);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
        <AdminButton
          variant={activeTab === "queue" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("queue")}
        >
          Queue
        </AdminButton>
        <AdminButton
          variant={activeTab === "broadcast" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("broadcast")}
        >
          Broadcast
        </AdminButton>
      </div>

      {activeTab === "queue" ? (
        <SupportPageClient rows={rows} timelineByTicket={timelineByTicket} />
      ) : (
        <SupportBroadcastActions
          announcements={announcements}
          outboundMessages={outboundMessages}
        />
      )}
    </div>
  );
}
