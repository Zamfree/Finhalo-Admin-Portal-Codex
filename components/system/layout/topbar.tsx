"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";

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
    <header className="admin-topbar sticky top-0 z-40 px-5 md:px-7 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] items-center gap-4 py-4">
        <div className="min-w-0 flex-1">
          <form onSubmit={handleSubmit} className="relative min-w-0 w-full max-w-[720px]">
            <label htmlFor="topbar-search" className="sr-only">
              {t("common.shell.globalSearchLabel")}
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="topbar-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder={t("common.shell.searchPlaceholder")}
              className="admin-control h-11 w-full rounded-2xl pl-11 pr-20 text-sm text-white placeholder:text-zinc-500 outline-none"
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

        <div className="flex shrink-0 items-center gap-3">
          <div className="admin-surface-soft flex items-center gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`admin-toggle-chip rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                language === "en" ? "admin-toggle-chip-active" : "text-zinc-400"
              }`}
            >
              {t("common.shell.english")}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("zh")}
              className={`admin-toggle-chip rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                language === "zh" ? "admin-toggle-chip-active" : "text-zinc-400"
              }`}
            >
              {t("common.shell.chinese")}
            </button>
          </div>
          <div className="admin-surface-soft flex items-center gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`admin-toggle-chip rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                theme === "light" ? "admin-toggle-chip-active" : "text-zinc-400"
              }`}
            >
              {t("common.shell.light")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`admin-toggle-chip rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                theme === "dark" ? "admin-toggle-chip-active" : "text-zinc-400"
              }`}
            >
              {t("common.shell.dark")}
            </button>
          </div>
          <button
            type="button"
            className="admin-interactive hidden h-10 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 md:inline-flex"
          >
            <Bell className="h-3.5 w-3.5" />
            {t("common.shell.alerts")}
          </button>
          <button
            type="button"
            className="admin-interactive flex h-10 items-center rounded-full border border-white/5 bg-white/5 px-3.5 text-xs text-zinc-300"
          >
            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">
              AK
            </span>
            {t("common.shell.admin")}
          </button>
        </div>
      </div>
    </header>
  );
}
