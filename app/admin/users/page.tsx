"use client";

import { useState } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { UsersTable } from "@/components/system/data/users-table";

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

const MOCK_USERS: UserRow[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test", role: "trader", created_at: "2026-02-01T10:30:00Z" },
  { user_id: "USR-1002", email: "mia@finhalo.test", role: "ib", created_at: "2026-02-03T08:14:00Z" },
  { user_id: "USR-1003", email: "sam@finhalo.test", role: "trader", created_at: "2026-02-06T13:55:00Z" },
  { user_id: "USR-1004", email: "olivia@finhalo.test", role: "admin", created_at: "2026-02-10T16:22:00Z" },
  { user_id: "USR-1005", email: "james@finhalo.test", role: "trader", created_at: "2026-02-12T11:45:00Z" },
  { user_id: "USR-1006", email: "sophia@finhalo.test", role: "trader", created_at: "2026-02-15T09:41:00Z" },
  { user_id: "USR-1007", email: "logan@finhalo.test", role: "ib", created_at: "2026-02-17T15:20:00Z" },
  { user_id: "USR-1008", email: "ava@finhalo.test", role: "trader", created_at: "2026-02-20T12:08:00Z" },
  { user_id: "USR-1009", email: "lucas@finhalo.test", role: "trader", created_at: "2026-02-24T07:10:00Z" },
  { user_id: "USR-1010", email: "noah@finhalo.test", role: "trader", created_at: "2026-02-27T18:30:00Z" },
];

export default function UsersPage() {
  const [queryInput, setQueryInput] = useState("");
  const [sortInput, setSortInput] = useState<"desc" | "asc">("desc");

  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedSort, setAppliedSort] = useState<"desc" | "asc">("desc");

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(queryInput);
    setAppliedSort(sortInput);
  }

  const filteredUsers = MOCK_USERS.filter((user) => {
    const keyword = appliedQuery.trim().toLowerCase();

    if (!keyword) return true;

    return (
      user.email.toLowerCase().includes(keyword) ||
      user.user_id.toLowerCase().includes(keyword)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();

    return appliedSort === "desc" ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Directory
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Users
            </h1>
          </div>
        }
        description={
          <p className="text-sm text-zinc-400">
            Reference implementation of the updated table/list visual system.
          </p>
        }
        actions={
          <button
            type="button"
            className="h-11 rounded-xl bg-white/10 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-100 hover:bg-white/15"
          >
            Invite User
          </button>
        }
        filters={
          <form
            onSubmit={handleApply}
            className="grid gap-3 md:grid-cols-[1fr_220px_180px] md:items-end"
          >
            <div>
              <label
                htmlFor="query"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Search users
              </label>
              <input
                id="query"
                name="query"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search by email or user ID"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="sort"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                value={sortInput}
                onChange={(e) => setSortInput(e.target.value as "desc" | "asc")}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/50"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:bg-white/10"
            >
              Apply
            </button>
          </form>
        }
        footer={`Page 1 | ${sortedUsers.length} users`}
      >
        <UsersTable rows={sortedUsers} />
      </DataPanel>
    </div>
  );
}