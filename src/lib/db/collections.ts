import { prisma } from "@/lib/prisma";

/**
 * No auth is wired up yet (see project-overview.md open questions), so every
 * dashboard query is scoped to the single seeded demo user for now.
 */
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CollectionItemType {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  itemCount: number;
  /** Distinct item types present in the collection, most-used first. */
  types: CollectionItemType[];
}

/** e.g. "snippet" -> "Snippets", matching the plural labels used elsewhere in the UI. */
function toLabel(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  return user?.id ?? null;
}

type CollectionWithItems = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: {
    item: {
      itemType: { id: string; name: string; icon: string; color: string };
    };
  }[];
};

/** Distinct item types present in the collection, most-used first. */
function toCollectionSummary(collection: CollectionWithItems): CollectionSummary {
  const typeCounts = new Map<
    string,
    { type: CollectionItemType; count: number }
  >();

  for (const { item } of collection.items) {
    const existing = typeCounts.get(item.itemType.id);
    if (existing) {
      existing.count += 1;
    } else {
      typeCounts.set(item.itemType.id, {
        type: {
          id: item.itemType.id,
          name: item.itemType.name,
          label: toLabel(item.itemType.name),
          icon: item.itemType.icon,
          color: item.itemType.color,
        },
        count: 1,
      });
    }
  }

  const types = [...typeCounts.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ type }) => type);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    updatedAt: collection.updatedAt,
    itemCount: collection.items.length,
    types,
  };
}

const COLLECTION_ITEMS_INCLUDE = {
  items: {
    include: {
      item: {
        include: { itemType: true },
      },
    },
  },
} as const;

export async function getRecentCollections(
  limit: number,
): Promise<CollectionSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getFavoriteCollections(): Promise<CollectionSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getRecentNonFavoriteCollections(
  limit: number,
): Promise<CollectionSummary[]> {
  const userId = await getDemoUserId();

  if (!userId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: false },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getCollectionStats(): Promise<{
  total: number;
  favorites: number;
}> {
  const userId = await getDemoUserId();

  if (!userId) {
    return { total: 0, favorites: 0 };
  }

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
