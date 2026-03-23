import { redirect } from "next/navigation";

type NetworkIbAliasPageProps = {
  searchParams: Promise<{
    ib_user_id?: string;
  }>;
};

export default async function NetworkIbAliasPage({ searchParams }: NetworkIbAliasPageProps) {
  const { ib_user_id } = await searchParams;

  if (ib_user_id) {
    redirect(`/admin/network?ib_user_id=${encodeURIComponent(ib_user_id)}`);
  }

  redirect("/admin/network");
}
