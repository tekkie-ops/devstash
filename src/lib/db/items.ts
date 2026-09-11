import { prisma } from "@/lib/prisma";
import type { CollectionItemType } from "@/lib/db/collections";
import { getDemoUserId } from "@/lib/db/user";
import { deleteR2Object, r2KeyFromUrl } from "@/lib/r2";
import {
  ALL_CREATE_ITEM_TYPES,
  FILE_ITEM_TYPES,
} from "@/lib/validations/items";
import type { CreateItemInput, UpdateItemInput } from "@/lib/validations/items";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  type: CollectionItemType;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export interface ItemTypeSummary extends CollectionItemType {
  itemCount: number;
}

/** Full item payload for the drawer detail view — the summary plus everything loaded on click. */
export interface ItemDetail extends ItemSummary {
  contentType: "text" | "file";
  language: string | null;
  collections: { id: string; name: string }[];
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
  createdAt: Date;
  updatedAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { tag: { name: string } }[];
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map(({ tag }) => tag.name),
    type: {
      id: item.itemType.id,
      name: item.itemType.name,
      label: toLabel(item.itemType.name),
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
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

/**
 * The system item types offered in the New Item dialog, in a fixed order.
 * Not user-scoped — system types are shared.
 */
export async function getCreatableItemTypes(): Promise<CollectionItemType[]> {
  const types = await prisma.itemType.findMany({ where: { isSystem: true } });

  return ALL_CREATE_ITEM_TYPES.map((name) =>
    types.find((type) => type.name === name),
  )
    .filter((type): type is NonNullable<typeof type> => type !== undefined)
    .map((type) => ({
      id: type.id,
      name: type.name,
      label: toLabel(type.name),
      icon: type.icon,
      color: type.color,
    }));
}

/**
 * Creates an item owned by `userId` from the New Item dialog. Resolves the
 * chosen type name to its system `ItemType`; returns null when the type name is
 * unknown. `file` / `image` items store the uploaded R2 object's metadata and
 * `contentType: "file"`; every other type is text-kind. Returns the fresh
 * `ItemDetail` so the caller can open the drawer without a second fetch.
 */
export async function createItem(
  userId: string,
  data: CreateItemInput,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { isSystem: true, name: data.type },
    select: { id: true },
  });

  if (!itemType) {
    return null;
  }

  const isFile = (FILE_ITEM_TYPES as readonly string[]).includes(data.type);

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: isFile ? null : data.content,
      url: isFile ? null : data.url,
      language: isFile ? null : data.language,
      fileUrl: isFile ? data.fileUrl : null,
      fileName: isFile ? data.fileName : null,
      fileSize: isFile ? data.fileSize : null,
      contentType: isFile ? "file" : "text",
      userId,
      itemTypeId: itemType.id,
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
    select: { id: true },
  });

  return getItemDetail(userId, created.id);
}

/**
 * Full detail for a single item, scoped to its owner. Returns null when the id
 * matches nothing `userId` owns.
 */
export async function getItemDetail(
  userId: string,
  id: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  if (!item) {
    return null;
  }

  return {
    ...toItemSummary(item),
    contentType: item.contentType,
    language: item.language,
    collections: item.collections.map(({ collection }) => collection),
  };
}

/**
 * Applies an edit from the drawer, scoped to the item's owner; returns null
 * when the id matches nothing `userId` owns.
 * Tags are replaced wholesale — existing join rows are dropped and the new set
 * is connect-or-created. Returns the refreshed `ItemDetail` so the drawer can
 * update without a second fetch.
 */
export async function updateItem(
  userId: string,
  id: string,
  data: UpdateItemInput,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        deleteMany: {},
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
  });

  return getItemDetail(userId, id);
}

/**
 * Permanently deletes an item, scoped to its owner. `ItemTag` /
 * `ItemCollection` join rows cascade on delete (see schema), so no manual
 * cleanup there. A `file` / `image` item's backing R2 object is removed
 * best-effort after the row is gone — a failure is logged, not fatal, since the
 * item is already deleted. Returns false when the id matches nothing `userId`
 * owns, true once the row is gone.
 */
export async function deleteItem(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, contentType: true, fileUrl: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.item.delete({ where: { id } });

  if (existing.contentType === "file" && existing.fileUrl) {
    const key = r2KeyFromUrl(existing.fileUrl);
    if (key) {
      try {
        await deleteR2Object(key);
      } catch (error) {
        console.error(`Failed to delete R2 object for item ${id}:`, error);
      }
    }
  }

  return true;
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
