import {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves the `icon` field on an ItemType to its lucide component.
 * Keys must match the icon names used in the item type data.
 */
export const ITEM_TYPE_ICONS: Record<string, LucideIcon | undefined> = {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
};
