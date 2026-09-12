import { prisma } from "@/lib/prisma";
import { toLabel } from "@/lib/item-types";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";

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

/** Safety cap on the /collections list page — it has no pagination to fall back on. */
const ALL_COLLECTIONS_LIMIT = 100;

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

/** All of a user's collections, newest-updated first, for the /collections list page. */
export async function getAllCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: ALL_COLLECTIONS_LIMIT,
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

/**
 * A single collection's summary for the /collections/[id] detail page, scoped
 * to its owner. Returns null when the id matches nothing `userId` owns.
 */
export async function getCollectionDetail(
  userId: string,
  id: string,
): Promise<CollectionSummary | null> {
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    include: COLLECTION_ITEMS_INCLUDE,
  });

  if (!collection) {
    return null;
  }

  return toCollectionSummary(collection);
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

/**
 * Updates a collection's name/description, scoped to its owner. Returns null
 * when the id isn't one `userId` owns.
 */
export async function updateCollection(
  userId: string,
  id: string,
  data: UpdateCollectionInput,
): Promise<CollectionSummary | null> {
  const existing = await prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
    include: COLLECTION_ITEMS_INCLUDE,
  });

  return toCollectionSummary(collection);
}

/**
 * Deletes a collection, scoped to its owner. Only the `ItemCollection`
 * membership rows for this collection cascade — the `Item` rows themselves,
 * and any other collection memberships they have, are untouched. Returns
 * false when the id isn't one `userId` owns.
 */
export async function deleteCollection(
  userId: string,
  id: string,
): Promise<boolean> {
  const existing = await prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.collection.delete({ where: { id } });

  return true;
}
