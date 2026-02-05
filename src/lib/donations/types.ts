export type DonationCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  sort_rank: number;
  created_at: string | null;
};

export type Donation = {
  id: string;
  campaign_id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  phone: string | null;
  created_at: string;
};
