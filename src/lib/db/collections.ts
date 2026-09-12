import { prisma } from "@/lib/prisma";
import { toLabel } from "@/lib/item-types";
import { COLLECTIONS_PER_PAGE, getSkip } from "@/lib/pagination";
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

/**
 * A user's favorited collections, most-recently-favorited first (updatedAt is
 * used as the favorited-at proxy, same convention as `getFavoriteItems`).
 * Takes an explicit `limit` since callers need different caps — the sidebar's
 * small Favorites group vs. the /favorites page's full listing.
 */
export async function getFavoriteCollections(
  userId: string,
  limit: number,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
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

/**
 * A user's collections, newest-updated first, for the /collections list page —
 * one `COLLECTIONS_PER_PAGE` page at a time.
 */
export async function getAllCollections(
  userId: string,
  page: number,
): Promise<{ collections: CollectionSummary[]; totalCount: number }> {
  const where = { userId };
  const [collections, totalCount] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: getSkip(page, COLLECTIONS_PER_PAGE),
      take: COLLECTIONS_PER_PAGE,
      include: COLLECTION_ITEMS_INCLUDE,
    }),
    prisma.collection.count({ where }),
  ]);

  return { collections: collections.map(toCollectionSummary), totalCount };
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

export interface SearchableCollection {
  id: string;
  name: string;
  itemCount: number;
}

/** Safety cap on the command palette's pre-fetched collection list. */
const SEARCH_COLLECTIONS_LIMIT = 500;

/**
 * Lightweight collection listing for the command palette — just what a
 * result row shows (name, item count), skipping `COLLECTION_ITEMS_INCLUDE`'s
 * per-item type join since the palette only needs a count.
 */
export async function getSearchableCollections(
  userId: string,
): Promise<SearchableCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    take: SEARCH_COLLECTIONS_LIMIT,
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
    },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemCount: collection._count.items,
  }));
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
