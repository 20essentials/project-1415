import { items, menus, sections } from "@wix/restaurants";
import { auth } from "@wix/essentials";

export const JUNGLE_MENU_NAME = "Jungle Tasting";

export interface DiningMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
}

export interface DiningMenuSection {
  id: string;
  name: string;
  description: string | null;
  items: DiningMenuItem[];
}

export interface DiningMenu {
  id: string;
  name: string;
  description: string | null;
  sections: DiningMenuSection[];
}

const listMenusElevated = auth.elevate(menus.listMenus);
const listSectionsElevated = auth.elevate(sections.listSections);
const listItemsElevated = auth.elevate(items.listItems);

interface RawMenu {
  _id?: string;
  name?: string;
  description?: string;
  sectionIds?: string[];
  visible?: boolean;
}

interface RawSection {
  _id?: string;
  name?: string;
  description?: string;
  itemIds?: string[];
  visible?: boolean;
}

interface RawItem {
  _id?: string;
  name?: string;
  description?: string;
  visible?: boolean;
  priceInfo?: { price?: string };
}

// Display order lives in the parent's id arrays; the list* responses are unordered.
function assembleSections(rawSections: RawSection[], rawItems: RawItem[], orderedSectionIds: string[] | undefined): DiningMenuSection[] {
  const itemsById = new Map(rawItems.map((item) => [item._id, item]));
  const sectionsById = new Map(rawSections.map((section) => [section._id, section]));

  return (orderedSectionIds ?? [])
    .map((sectionId) => sectionsById.get(sectionId))
    .filter((section): section is RawSection => Boolean(section))
    .map((section) => ({
      id: section._id ?? "",
      name: section.name ?? "",
      description: section.description ?? null,
      items: (section.itemIds ?? [])
        .map((itemId) => itemsById.get(itemId))
        .filter((item): item is RawItem => Boolean(item))
        .map(
          (item): DiningMenuItem => ({
            id: item._id ?? "",
            name: item.name ?? "",
            description: item.description ?? null,
            // The SDK PriceInfo type carries only `price`; there is no
            // formattedPrice, and the deprecated top-level `price` reads
            // undefined against seeded data.
            price: item.priceInfo?.price ?? null,
          }),
        ),
    }));
}

export async function getJungleMenu(): Promise<DiningMenu | null> {
  try {
    const { menus: menuList = [] } = await listMenusElevated({ onlyVisible: true });
    const menu = menuList.find((candidate) => candidate.name === JUNGLE_MENU_NAME) ?? (menuList as RawMenu[])[0];
    if (!menu?._id) return null;

    const [{ sections: allSections = [] }, { items: allItems = [] }] = await Promise.all([
      listSectionsElevated({ onlyVisible: true }),
      listItemsElevated({ onlyVisible: true }),
    ]);

    return {
      id: menu._id,
      name: menu.name ?? JUNGLE_MENU_NAME,
      description: menu.description ?? null,
      sections: assembleSections(allSections as RawSection[], allItems as RawItem[], menu.sectionIds),
    };
  } catch (error) {
    console.error("[dining/menu] menu lookup failed:", error);
    return null;
  }
}
