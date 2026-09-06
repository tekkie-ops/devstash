import { prisma } from "@/lib/prisma";

export interface ProfileAccount {
  hasPassword: boolean;
  createdAt: Date;
}

export interface ProfileTypeBreakdown {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  itemCount: number;
}

export interface ProfileStats {
  itemCount: number;
  collectionCount: number;
  typeBreakdown: ProfileTypeBreakdown[];
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

export async function getProfileAccount(userId: string): Promise<ProfileAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, password: true },
  });

  if (!user) {
    return null;
  }

  return { hasPassword: !!user.password, createdAt: user.createdAt };
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [itemCount, collectionCount, types] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: {
        _count: { select: { items: { where: { userId } } } },
      },
    }),
  ]);

  const typeBreakdown = types
    .map((type) => ({
      id: type.id,
      name: type.name,
      label: toLabel(type.name),
      icon: type.icon,
      color: type.color,
      itemCount: type._count.items,
    }))
    .sort(
      (a, b) => SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
    );

  return { itemCount, collectionCount, typeBreakdown };
}
