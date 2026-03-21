"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminTopbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";
  const [draftSearch, setDraftSearch] = useState(searchValue);

  useEffect(() => {
    setDraftSearch(searchValue);
  }, [searchValue]);

  function updateSearch(nextValue: string) {
    const trimmedValue = nextValue.trim();
    const params = new URLSearchParams();

    if (trimmedValue) {
      params.set("q", trimmedValue);
    }

    const nextUrl = params.toString() ? `/admin/search?${params.toString()}` : "/admin/search";
    router.replace(nextUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch(draftSearch);
  }

  return (
    <header className="relative z-10 px-6 pt-6 md:px-10">
      <div className="flex items-center justify-between gap-8 rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <div className="flex min-w-0 flex-1 justify-center">
          <form onSubmit={handleSubmit} className="relative min-w-0 w-full max-w-[780px]">
          <label htmlFor="topbar-search" className="sr-only">
            Global search
          </label>
            <input
              id="topbar-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search users, brokers, transactions..."
              className="admin-control h-10 w-full rounded-2xl bg-zinc-950/70 px-4 pr-20 text-sm text-white placeholder:text-zinc-500 outline-none"
            />

            {draftSearch ? (
              <button
                type="button"
                onClick={() => {
                  setDraftSearch("");
                  updateSearch("");
                }}
                className="admin-link-action absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  Clear
                </button>
              ) : null}
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-5">
          <button
            type="button"
            className="admin-interactive hidden h-9 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 md:block"
          >
            Alerts
          </button>
          <button
            type="button"
            className="admin-interactive flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs text-zinc-300"
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">AK</span>
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}
