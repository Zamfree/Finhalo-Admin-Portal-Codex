import { redirect } from "next/navigation";

type LedgerDetailPageProps = {
  params: Promise<{
    ledger_ref: string;
  }>;
};

export default async function LedgerDetailPage({ params }: LedgerDetailPageProps) {
  const { ledger_ref } = await params;
  const nextParams = new URLSearchParams({
    ledger_ref,
  });

  redirect(`/admin/finance/ledger?${nextParams.toString()}`);
}
