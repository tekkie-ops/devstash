import { items, itemTypes, type Item, type ItemType } from "@/lib/mock-data";

const itemTypesById = new Map(itemTypes.map((type) => [type.id, type]));

/** Resolves an item's `typeId`. Undefined only if the data is inconsistent. */
export function getItemType(typeId: string): ItemType | undefined {
  return itemTypesById.get(typeId);
}

export function itemsInCollection(collectionId: string): Item[] {
  return items.filter((item) => item.collectionIds.includes(collectionId));
}

/** Distinct types used inside a collection, most used first. */
export function collectionTypes(collectionId: string): ItemType[] {
  const counts = new Map<string, number>();

  for (const item of itemsInCollection(collectionId)) {
    counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([typeId]) => getItemType(typeId))
    .filter((type): type is ItemType => type !== undefined);
}

/** Newest first, for anything carrying an `updatedAt`. */
export function byNewest(a: { updatedAt: string }, b: { updatedAt: string }) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Fixed to UTC so the server and client render the same string. */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatItemDate(date: Date): string {
  return dateFormatter.format(date);
}
