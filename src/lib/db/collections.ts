import { prisma } from "@/lib/prisma";
import { toLabel } from "@/lib/item-types";
import type { CreateCollectionInput } from "@/lib/validations/collections";

export interface CollectionItemType {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

export interface CollectionOption {
  id: string;
  name: string;
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

/**
 * `toCollectionSummary` only needs each item's type (for the count and the
 * dominant-type ordering), so select just that — pulling full item rows here
 * would drag every snippet body along on each dashboard/sidebar load.
 */
const COLLECTION_ITEMS_INCLUDE = {
  items: {
    select: {
      item: {
        select: { itemType: true },
      },
    },
  },
} as const;

/** Cap on the sidebar's Favorites group — it has no pagination to fall back on. */
const FAVORITE_COLLECTIONS_LIMIT = 12;

export async function getRecentCollections(
  userId: string,
  limit: number,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getFavoriteCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    take: FAVORITE_COLLECTIONS_LIMIT,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getRecentNonFavoriteCollections(
  userId: string,
  limit: number,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: false },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

/** All of a user's collections, name-sorted, for the item create/edit collection picker. */
export async function getCollectionsForSelect(
  userId: string,
): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getCollectionStats(userId: string): Promise<{
  total: number;
  favorites: number;
}> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}

/**
 * Creates a collection owned by `userId` from the New Collection dialog. No
 * items/type association at create time — those are set later.
 */
export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<CollectionSummary> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return toCollectionSummary(collection);
}
