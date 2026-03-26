import { redirect } from "next/navigation";

type CommissionBatchesPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function CommissionBatchesPage({
  searchParams,
}: CommissionBatchesPageProps) {
  const { returnTo, source } = await searchParams;
  const params = new URLSearchParams({
    show_all: "1",
  });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  if (source) {
    params.set("source", source);
  }

  redirect(`/admin/commission?${params.toString()}`);
}
