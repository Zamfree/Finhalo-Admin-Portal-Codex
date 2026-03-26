import { redirect } from "next/navigation";

type CommissionSimulatePageProps = {
  searchParams: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function CommissionSimulatePage({
  searchParams,
}: CommissionSimulatePageProps) {
  const { returnTo, source } = await searchParams;
  const params = new URLSearchParams();

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  if (source) {
    params.set("source", source);
  }

  const nextUrl = params.toString() ? `/admin/commission?${params.toString()}` : "/admin/commission";
  redirect(nextUrl);
}
