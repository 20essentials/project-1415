import { describe, expect, it, vi, beforeEach } from 'vitest';
import { menus, sections, items } from '@wix/restaurants';
import { getJungleMenu } from '@/features/dining/menu';

vi.mock('@wix/restaurants', () => ({
  menus: { listMenus: vi.fn() },
  sections: { listSections: vi.fn() },
  items: { listItems: vi.fn() },
}));

const mockList = menus.listMenus as ReturnType<typeof vi.fn>;
const mockListSections = sections.listSections as ReturnType<typeof vi.fn>;
const mockListItems = items.listItems as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getJungleMenu', () => {
  it('assembles sections and items in id-array order, not response order', async () => {
    mockList.mockResolvedValue({
      menus: [
        {
          _id: 'menu-1',
          name: 'Jungle Tasting',
          description: 'A tasting menu.',
          sectionIds: ['sec-b', 'sec-a'],
          visible: true,
        },
      ],
    });
    mockListSections.mockResolvedValue({
      sections: [
        { _id: 'sec-a', name: 'Garden desserts', itemIds: ['item-c'], visible: true },
        { _id: 'sec-b', name: 'Botanical bar', itemIds: ['item-b', 'item-a'], visible: true },
      ],
    });
    mockListItems.mockResolvedValue({
      items: [
        { _id: 'item-a', name: 'First', priceInfo: { price: '9.50' }, visible: true },
        { _id: 'item-b', name: 'Second', priceInfo: { price: '12.00' }, visible: true },
        { _id: 'item-c', name: 'Third', priceInfo: { price: '8.00' }, visible: true },
      ],
    });

    const menu = await getJungleMenu();
    expect(mockList).toHaveBeenCalledWith({ onlyVisible: true });
    expect(menu?.name).toBe('Jungle Tasting');
    expect(menu?.sections.map((section) => section.name)).toEqual(['Botanical bar', 'Garden desserts']);
    expect(menu?.sections[0].items.map((item) => item.name)).toEqual(['Second', 'First']);
    expect(menu?.sections[0].items[0].price).toBe('12.00');
  });

  it('drops dangling child ids instead of crashing', async () => {
    mockList.mockResolvedValue({
      menus: [{ _id: 'menu-1', name: 'Jungle Tasting', sectionIds: ['sec-gone'] }],
    });
    mockListSections.mockResolvedValue({ sections: [] });
    mockListItems.mockResolvedValue({ items: [] });

    const menu = await getJungleMenu();
    expect(menu?.sections).toEqual([]);
  });

  it('returns null when no menu exists', async () => {
    mockList.mockResolvedValue({ menus: [] });
    expect(await getJungleMenu()).toBeNull();
  });

  it('returns null (not throws) when Wix fails', async () => {
    mockList.mockRejectedValue(new Error('boom'));
    expect(await getJungleMenu()).toBeNull();
  });
});
