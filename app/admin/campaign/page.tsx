import { redirect } from "next/navigation";

export default function CampaignRedirectPage() {
  redirect("/admin/campaigns");
}
