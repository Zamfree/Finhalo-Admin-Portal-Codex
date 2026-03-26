import { redirect } from "next/navigation";

type BatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function CommissionBatchDetailPage({
  params,
  searchParams,
}: BatchDetailProps) {
  const { batch_id } = await params;
  const { returnTo, source } = searchParams ? await searchParams : {};

  const nextParams = new URLSearchParams({
    show_all: "1",
    detail_batch_id: batch_id,
  });

  if (returnTo) {
    nextParams.set("returnTo", returnTo);
  }

  if (source) {
    nextParams.set("source", source);
  }

  redirect(`/admin/commission?${nextParams.toString()}`);
}
