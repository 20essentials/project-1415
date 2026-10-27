import { beforeEach, describe, expect, it, vi } from 'vitest';

const { eq, descending, limit, find, queryDonationCampaigns, getDonationCampaignMetrics } = vi.hoisted(() => {
  const eq = vi.fn();
  const descending = vi.fn();
  const limit = vi.fn();
  const find = vi.fn();
  const queryDonationCampaigns = vi.fn();
  const getDonationCampaignMetrics = vi.fn();
  return { eq, descending, limit, find, queryDonationCampaigns, getDonationCampaignMetrics };
});

vi.mock('@wix/donations', () => ({
  donationCampaigns: {
    queryDonationCampaigns: () => queryDonationCampaigns(),
    getDonationCampaignMetrics: (campaignId: string) => getDonationCampaignMetrics(campaignId),
  },
}));

const CAMPAIGN_ID = '22aba8a5-0398-4231-8701-dcf16f0cecb5';

const sdkCampaign = {
  _id: CAMPAIGN_ID,
  name: 'New local',
  status: 'COLLECTING',
  archived: false,
  customAmountEnabled: true,
  customAmountOptions: {
    minimum: { amount: '5.00', formattedAmount: '5,00€' },
  },
  predefinedDonationAmounts: [
    {
      _id: '7c1a3d2e-0000-0000-0000-000000000000',
      price: { amount: '10', formattedAmount: '10,00€' },
      description: 'Warms the propagation beds',
    },
    {
      _id: 'a9d4f6b1-0000-0000-0000-000000000000',
      price: { amount: '25', formattedAmount: '25,00€' },
      description: 'Plants a shelf of flytraps',
    },
    {
      _id: undefined,
      price: { amount: '50', formattedAmount: '50,00€' },
    },
    {
      _id: '5b2f9e4d-0000-0000-0000-000000000000',
      price: {},
    },
  ],
  campaignGoal: {
    targetAmount: { amount: '20000', formattedAmount: '20.000,00€' },
  },
};

async function loadFeature() {
  vi.resetModules();
  return import('@/features/donations/donations');
}

describe('getDonationCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    find.mockResolvedValue({ items: [sdkCampaign] });
    limit.mockReturnValue({ find });
    descending.mockReturnValue({ limit });
    eq.mockReturnValue({ descending });
    queryDonationCampaigns.mockReturnValue({ eq });
  });

  it('queries the donation campaigns endpoint with the builder chain', async () => {
    const { getDonationCampaign } = await loadFeature();

    await getDonationCampaign();

    expect(queryDonationCampaigns).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith('archived', false);
    expect(descending).toHaveBeenCalledWith('_createdDate');
    expect(limit).toHaveBeenCalledWith(50);
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('maps the SDK payload onto the public DonationCampaignInfo shape', async () => {
    const { getDonationCampaign } = await loadFeature();

    const campaign = await getDonationCampaign();

    expect(campaign).toEqual({
      id: CAMPAIGN_ID,
      name: 'New local',
      status: 'COLLECTING',
      archived: false,
      customAmountEnabled: true,
      minimumAmount: '5.00',
      minimumFormattedAmount: '5,00€',
      presets: [
        {
          id: '7c1a3d2e-0000-0000-0000-000000000000',
          amount: '10',
          formattedAmount: '10,00€',
          description: 'Warms the propagation beds',
        },
        {
          id: 'a9d4f6b1-0000-0000-0000-000000000000',
          amount: '25',
          formattedAmount: '25,00€',
          description: 'Plants a shelf of flytraps',
        },
      ],
      goalTargetAmount: '20000',
      goalFormattedTargetAmount: '20.000,00€',
    });
  });

  it('skips campaigns without a collecting status and returns null when nothing remains', async () => {
    find.mockResolvedValue({ items: [{ ...sdkCampaign, status: 'EXPIRED' }] });
    const { getDonationCampaign } = await loadFeature();

    await expect(getDonationCampaign()).resolves.toBeNull();
  });

  it('returns null when the site has no donation campaign', async () => {
    find.mockResolvedValue({ items: [] });
    const { getDonationCampaign } = await loadFeature();

    await expect(getDonationCampaign()).resolves.toBeNull();
  });

  it('returns null when the query fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    find.mockRejectedValue(new Error('boom'));
    const { getDonationCampaign } = await loadFeature();

    await expect(getDonationCampaign()).resolves.toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('coalesces concurrent reads into a single query', async () => {
    const { getDonationCampaign } = await loadFeature();

    const [first, second] = await Promise.all([getDonationCampaign(), getDonationCampaign()]);

    expect(queryDonationCampaigns).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });
});

describe('getDonationGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDonationCampaignMetrics.mockResolvedValue({
      currencyMetricsList: [
        {
          currencyCode: 'EUR',
          donationCount: 3,
          totalAmount: { amount: '35', formattedAmount: '35,00€' },
        },
      ],
    });
  });

  it('maps the first currency metric row', async () => {
    const { getDonationGoal } = await loadFeature();

    const goal = await getDonationGoal(CAMPAIGN_ID);

    expect(goal).toEqual({
      donationCount: 3,
      raisedAmount: '35',
      formattedRaisedAmount: '35,00€',
      currencyCode: 'EUR',
    });
  });

  it('returns null when no metrics data exists for the campaign', async () => {
    getDonationCampaignMetrics.mockResolvedValue({ currencyMetricsList: [] });
    const { getDonationGoal } = await loadFeature();

    await expect(getDonationGoal(CAMPAIGN_ID)).resolves.toBeNull();
  });

  it('returns null when the metrics endpoint rejects', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    getDonationCampaignMetrics.mockRejectedValue(new Error('GOAL_NOT_SET'));
    const { getDonationGoal } = await loadFeature();

    await expect(getDonationGoal(CAMPAIGN_ID)).resolves.toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('parseDonationAmount', () => {
  it('accepts dot and comma decimals', async () => {
    const { parseDonationAmount } = await loadFeature();

    expect(parseDonationAmount('10', '5.00')).toBe(10);
    expect(parseDonationAmount('12,5', '5.00')).toBe(12.5);
    expect(parseDonationAmount(' 5.00 ', '5.00')).toBe(5);
  });

  it('rejects empty, non-numeric and non-positive input', async () => {
    const { parseDonationAmount } = await loadFeature();

    expect(parseDonationAmount('', '5.00')).toBeNull();
    expect(parseDonationAmount('abc', '5.00')).toBeNull();
    expect(parseDonationAmount('0', '5.00')).toBeNull();
    expect(parseDonationAmount('-10', '5.00')).toBeNull();
    expect(parseDonationAmount('NaN', '5.00')).toBeNull();
  });

  it('rejects amounts below the campaign minimum', async () => {
    const { parseDonationAmount } = await loadFeature();

    expect(parseDonationAmount('4.99', '5.00')).toBeNull();
    expect(parseDonationAmount('5', '5.00')).toBe(5);
  });

  it('treats a missing minimum as an open floor', async () => {
    const { parseDonationAmount } = await loadFeature();

    expect(parseDonationAmount('0.01', null)).toBe(0.01);
  });
});
