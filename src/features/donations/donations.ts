import { type DonationCampaign } from "@wix/auto_sdk_donations_donation-campaigns";
import { donationCampaigns } from "@wix/donations";
import { auth } from "@wix/essentials";

export const WIX_DONATIONS_APP_ID = "333b456e-dd48-4d6b-b32b-9fd48d74e163";

export interface DonationPreset {
  id: string;
  amount: string;
  formattedAmount: string;
  description: string;
}

export interface DonationCampaignInfo {
  id: string;
  name: string;
  status: string;
  archived: boolean;
  customAmountEnabled: boolean;
  minimumAmount: string | null;
  minimumFormattedAmount: string | null;
  presets: DonationPreset[];
  goalTargetAmount: string | null;
  goalFormattedTargetAmount: string | null;
}

export interface DonationGoal {
  donationCount: number;
  raisedAmount: string;
  formattedRaisedAmount: string;
  currencyCode: string;
}

interface DonationGoalResponse {
  currencyMetricsList?: Array<{
    currencyCode?: string;
    donationCount?: number;
    totalAmount?: { amount?: string; formattedAmount?: string };
  }>;
}

const queryCampaignsElevated = auth.elevate(donationCampaigns.queryDonationCampaigns);
const getMetricsElevated = auth.elevate(donationCampaigns.getDonationCampaignMetrics);

function isCollecting(campaign: DonationCampaign): boolean {
  return campaign.status === "COLLECTING" && campaign.archived === false;
}

let campaignCache: Promise<DonationCampaignInfo | null> | null = null;

export function getDonationCampaign(): Promise<DonationCampaignInfo | null> {
  if (!campaignCache) {
    campaignCache = fetchDonationCampaign();
  }
  return campaignCache;
}

async function fetchDonationCampaign(): Promise<DonationCampaignInfo | null> {
  try {
    const result = await queryCampaignsElevated()
      .eq("archived", false)
      .descending("_createdDate")
      .limit(50)
      .find();
    const source = result.items.find(isCollecting);
    if (!source || !source._id) return null;
    return toCampaignInfo(source);
  } catch (error) {
    console.error("[donations] getDonationCampaign failed:", error);
    return null;
  }
}

function toCampaignInfo(campaign: DonationCampaign): DonationCampaignInfo {
  const goal = campaign.campaignGoal?.targetAmount?.amount;
  const formattedGoal = campaign.campaignGoal?.targetAmount?.formattedAmount;
  return {
    id: campaign._id ?? "",
    name: campaign.name ?? "",
    status: campaign.status ?? "",
    archived: campaign.archived ?? false,
    customAmountEnabled: campaign.customAmountEnabled ?? false,
    minimumAmount: campaign.customAmountOptions?.minimum?.amount ?? null,
    minimumFormattedAmount: campaign.customAmountOptions?.minimum?.formattedAmount ?? null,
    presets: (campaign.predefinedDonationAmounts ?? [])
      .filter((preset) => preset._id && preset.price?.amount)
      .map((preset) => ({
        id: preset._id ?? "",
        amount: preset.price?.amount ?? "",
        formattedAmount: preset.price?.formattedAmount ?? "",
        description: preset.description ?? "",
      })),
    goalTargetAmount: goal ?? null,
    goalFormattedTargetAmount: formattedGoal ?? null,
  };
}

export async function getDonationGoal(donationCampaignId: string): Promise<DonationGoal | null> {
  try {
    const metrics = getMetricsElevated(donationCampaignId);
    const response: DonationGoalResponse = await metrics;
    const currencyMetric = response.currencyMetricsList?.[0];
    if (!currencyMetric?.totalAmount?.amount) return null;
    return {
      donationCount: currencyMetric.donationCount ?? 0,
      raisedAmount: currencyMetric.totalAmount.amount,
      formattedRaisedAmount: currencyMetric.totalAmount.formattedAmount ?? "",
      currencyCode: currencyMetric.currencyCode ?? "",
    };
  } catch (error) {
    console.error("[donations] getDonationGoal failed:", error);
    return null;
  }
}

export function parseDonationAmount(value: string, minimum: string | null): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) return null;
  const minimumCents = Math.round(Number(minimum ?? "0") * 100);
  if (cents < minimumCents) return null;
  return cents / 100;
}
