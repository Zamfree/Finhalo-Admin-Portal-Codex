import { redirect } from "next/navigation";

type LegacyBatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
};

export default async function LegacyCommissionBatchDetailPage({
  params,
}: LegacyBatchDetailProps) {
  const { batch_id } = await params;

  redirect(`/admin/commission/batches/${batch_id}`);
}
