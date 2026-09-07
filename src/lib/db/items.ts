import { prisma } from "@/lib/prisma";
import type { CollectionItemType } from "@/lib/db/collections";
import { getDemoUserId } from "@/lib/db/user";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  tags: string[];
  type: CollectionItemType;
}

export interface ItemTypeSummary extends CollectionItemType {
  itemCount: number;
}

/** Matches the canonical system-type ordering used elsewhere in the UI (see project-overview.md). */
const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

/** e.g. "snippet" -> "Snippets", matching the plural labels used elsewhere in the UI. */
function toLabel(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

function toItemSummary(item: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { tag: { name: string } }[];
}): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: item.updatedAt,
    tags: item.tags.map(({ tag }) => tag.name),
    type: {
      id: item.itemType.id,
      name: item.itemType.name,
      label: toLabel(item.itemType.name),
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
  };
}

export async function getPinnedItems(): Promise<ItemSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
  });

  return items.map(toItemSummary);
}

export async function getRecentItems(limit: number): Promise<ItemSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
  });

  return items.map(toItemSummary);
}

/**
 * Resolves a URL slug (the lowercased plural label, e.g. "snippets") to its
 * system item type and that type's items for the demo user, newest first.
 * Returns null when the slug matches no system type.
 */
export async function getItemsByTypeSlug(slug: string): Promise<{
  type: CollectionItemType;
  items: ItemSummary[];
} | null> {
  const userId = await getDemoUserId();

  if (!userId) {
    return null;
  }

  const normalized = slug.toLowerCase();
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
  });
  const matched = systemTypes.find(
    (type) => toLabel(type.name).toLowerCase() === normalized,
  );

  if (!matched) {
    return null;
  }

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: matched.id },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
  });

  return {
    type: {
      id: matched.id,
      name: matched.name,
      label: toLabel(matched.name),
      icon: matched.icon,
      color: matched.color,
    },
    items: items.map(toItemSummary),
  };
}

export async function getItemTypesWithCounts(): Promise<ItemTypeSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: {
        select: { items: { where: { userId } } },
      },
    },
  });

  return types
    .map((type) => ({
      id: type.id,
      name: type.name,
      label: toLabel(type.name),
      icon: type.icon,
      color: type.color,
      itemCount: type._count.items,
    }))
    .sort(
      (a, b) =>
        SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
    );
}

export async function getItemStats(): Promise<{
  total: number;
  favorites: number;
}> {
  const userId = await getDemoUserId();

  if (!userId) {
    return { total: 0, favorites: 0 };
  }

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
