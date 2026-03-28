import { redirect } from "next/navigation";

export default async function LegacyAccountDetailPage({
  params,
}: {
  params: Promise<{ account_id: string }>;
}) {
  const { account_id } = await params;
  redirect(`/admin/accounts/${encodeURIComponent(account_id)}`);
}

