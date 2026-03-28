"use client";

import { useActionState } from "react";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import {
  publishAnnouncementAction,
  sendAdminMessageAction,
} from "./actions";
import type { SupportAnnouncement, SupportOutboundMessage } from "./_types";

type ReplyState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ReplyState = {};

export function SupportBroadcastActions({
  announcements,
  outboundMessages,
}: {
  announcements: SupportAnnouncement[];
  outboundMessages: SupportOutboundMessage[];
}) {
  const [announcementState, announcementAction, isPublishing] = useActionState(
    publishAnnouncementAction,
    INITIAL_STATE
  );
  const [messageState, messageAction, isSending] = useActionState(
    sendAdminMessageAction,
    INITIAL_STATE
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Publish System Announcement
          </h3>
        }
      >
        <form action={announcementAction} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Title
            </span>
            <input
              required
              name="title"
              placeholder="Announcement title"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Body
            </span>
            <textarea
              required
              name="body"
              rows={4}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </span>
            <select
              name="status"
              defaultValue="published"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
            >
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </label>
          <div className="flex justify-end">
            <AdminButton type="submit" variant="primary" disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Announcement"}
            </AdminButton>
          </div>
          {announcementState.error ? (
            <p className="text-xs text-rose-300">{announcementState.error}</p>
          ) : null}
          {announcementState.success ? (
            <p className="text-xs text-emerald-300">{announcementState.success}</p>
          ) : null}
        </form>

        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Recent Announcements
          </p>
          {announcements.length === 0 ? (
            <p className="text-sm text-zinc-500">No announcement records yet.</p>
          ) : (
            announcements.slice(0, 3).map((item) => (
              <div key={item.announcement_id} className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.status} | {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DataPanel>

      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Send Admin Message
          </h3>
        }
      >
        <form action={messageAction} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Target User ID
              </span>
              <input
                name="target_user_id"
                placeholder="USR-1001"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Target Email
              </span>
              <input
                type="email"
                name="target_email"
                placeholder="user@example.com"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Subject
            </span>
            <input
              required
              name="subject"
              placeholder="Message subject"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Message
            </span>
            <textarea
              required
              name="body"
              rows={4}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>
          <div className="flex justify-end">
            <AdminButton type="submit" variant="secondary" disabled={isSending}>
              {isSending ? "Sending..." : "Send Message"}
            </AdminButton>
          </div>
          {messageState.error ? <p className="text-xs text-rose-300">{messageState.error}</p> : null}
          {messageState.success ? (
            <p className="text-xs text-emerald-300">{messageState.success}</p>
          ) : null}
        </form>

        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Recent Admin Messages
          </p>
          {outboundMessages.length === 0 ? (
            <p className="text-sm text-zinc-500">No admin message records yet.</p>
          ) : (
            outboundMessages.slice(0, 3).map((item) => (
              <div key={item.message_id} className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                <p className="font-medium text-white">{item.subject}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.target_user_id ?? item.target_email ?? "Unknown Target"} |{" "}
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DataPanel>
    </div>
  );
}
