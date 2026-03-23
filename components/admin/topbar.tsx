"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

export function AdminTopbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, theme, setTheme, t } = useAdminPreferences();
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
      <div className="admin-topbar flex items-center justify-between gap-6 rounded-2xl px-4 py-3">
        <div className="flex min-w-0 flex-1 justify-center">
          <form onSubmit={handleSubmit} className="relative min-w-0 w-full max-w-[780px]">
            <label htmlFor="topbar-search" className="sr-only">
              {t("common.shell.globalSearchLabel")}
            </label>
            <input
              id="topbar-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder={t("common.shell.searchPlaceholder")}
              className="admin-control h-10 w-full rounded-2xl px-4 pr-20 text-sm text-white placeholder:text-zinc-500 outline-none"
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
                {t("common.actions.clear")}
              </button>
            ) : null}
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-5">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                language === "en" ? "bg-white/[0.12] text-white" : "text-zinc-400"
              }`}
            >
              {t("common.shell.english")}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("zh")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                language === "zh" ? "bg-white/[0.12] text-white" : "text-zinc-400"
              }`}
            >
              {t("common.shell.chinese")}
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                theme === "light" ? "bg-white/[0.12] text-white" : "text-zinc-400"
              }`}
            >
              {t("common.shell.light")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                theme === "dark" ? "bg-white/[0.12] text-white" : "text-zinc-400"
              }`}
            >
              {t("common.shell.dark")}
            </button>
          </div>
          <button
            type="button"
            className="admin-interactive hidden h-9 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 md:block"
          >
            {t("common.shell.alerts")}
          </button>
          <button
            type="button"
            className="admin-interactive flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs text-zinc-300"
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">AK</span>
            {t("common.shell.admin")}
          </button>
        </div>
      </div>
    </header>
  );
}
