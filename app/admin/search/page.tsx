import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminSearchWorkspace } from "@/services/admin/search.service";

import { filterSearchWorkspace, getSearchWorkspaceSummary } from "./_mappers";
import { SearchSummaryCard } from "./_shared";
import { SearchPageClient } from "./search-page-client";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminSearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const workspace = await getAdminSearchWorkspace();
  const visibleWorkspace = filterSearchWorkspace(workspace, query);
  const summary = getSearchWorkspaceSummary(visibleWorkspace);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Search"
        title="Global Search"
        description="Search users, accounts, commission batches, and withdrawals from one operational entry point."
        accentClassName="bg-amber-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <SearchSummaryCard label="Total Results" value={summary.totalResults} emphasis="strong" />
        <SearchSummaryCard label="Users" value={summary.userCount} />
        <SearchSummaryCard label="Accounts" value={summary.accountCount} />
        <SearchSummaryCard label="Batches" value={summary.batchCount} />
        <SearchSummaryCard label="Withdrawals" value={summary.withdrawalCount} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Search Results</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            {query
              ? `Showing grouped results for "${query}".`
              : "Use the shared topbar search to narrow results across major admin entities."}
          </p>
        }
      >
        <SearchPageClient query={query} workspace={workspace} />
      </DataPanel>
    </div>
  );
}
