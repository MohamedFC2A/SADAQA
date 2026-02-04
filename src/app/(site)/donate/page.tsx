import { DonateCampaign } from "@/app/(site)/donate/donate-campaign";

export default function DonatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">التبرع</h1>
      <DonateCampaign />
    </div>
  );
}
